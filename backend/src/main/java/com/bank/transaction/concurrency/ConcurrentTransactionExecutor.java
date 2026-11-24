package com.bank.transaction.concurrency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Bounded Thread Pool Executor for concurrent banking transaction processing.
 * Guarantees controlled parallelism, prevents thread starvation, and isolates execution.
 */
@Component
public class ConcurrentTransactionExecutor implements DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(ConcurrentTransactionExecutor.class);

    private final ThreadPoolExecutor executor;

    public ConcurrentTransactionExecutor(
            @Value("${banking.concurrency.worker-pool-size:10}") int poolSize,
            @Value("${banking.concurrency.queue-capacity:1000}") int queueCapacity) {

        AtomicInteger threadCount = new AtomicInteger(1);
        ThreadFactory threadFactory = r -> {
            Thread thread = new Thread(r, "TxnWorker-" + threadCount.getAndIncrement());
            thread.setDaemon(false);
            thread.setPriority(Thread.NORM_PRIORITY);
            return thread;
        };

        // Bounded queue with CallerRunsPolicy under heavy backpressure
        BlockingQueue<Runnable> workQueue = new ArrayBlockingQueue<>(queueCapacity);
        RejectedExecutionHandler rejectionHandler = new ThreadPoolExecutor.CallerRunsPolicy();

        this.executor = new ThreadPoolExecutor(
                poolSize,
                poolSize * 2,
                60L,
                TimeUnit.SECONDS,
                workQueue,
                threadFactory,
                rejectionHandler
        );

        log.info("Initialized ConcurrentTransactionExecutor: CorePoolSize={}, MaxPoolSize={}, QueueCapacity={}",
                poolSize, poolSize * 2, queueCapacity);
    }

    /**
     * Submits a transaction callable task for asynchronous, bounded execution with SLF4J MDC propagation.
     */
    public <T> CompletableFuture<T> submit(Callable<T> task) {
        CompletableFuture<T> future = new CompletableFuture<>();
        Map<String, String> callerContext = MDC.getCopyOfContextMap();

        executor.submit(() -> {
            Map<String, String> previousContext = MDC.getCopyOfContextMap();
            if (callerContext != null) {
                MDC.setContextMap(callerContext);
            } else {
                MDC.clear();
            }
            try {
                T result = task.call();
                future.complete(result);
            } catch (Throwable t) {
                future.completeExceptionally(t);
            } finally {
                if (previousContext != null) {
                    MDC.setContextMap(previousContext);
                } else {
                    MDC.clear();
                }
            }
        });
        return future;
    }

    /**
     * Submits a batch of tasks simultaneously and returns a list of individual futures.
     */
    public <T> List<CompletableFuture<T>> submitAll(List<Callable<T>> tasks) {
        List<CompletableFuture<T>> futures = new ArrayList<>(tasks.size());
        for (Callable<T> task : tasks) {
            futures.add(submit(task));
        }
        return futures;
    }

    public int getActiveCount() {
        return executor.getActiveCount();
    }

    public int getPoolSize() {
        return executor.getPoolSize();
    }

    public int getQueueSize() {
        return executor.getQueue().size();
    }

    public long getCompletedTaskCount() {
        return executor.getCompletedTaskCount();
    }

    @Override
    public void destroy() {
        log.info("Shutting down ConcurrentTransactionExecutor...");
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
