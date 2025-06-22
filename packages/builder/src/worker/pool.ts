import type { Logger } from '../logger/index.js'
import { logger } from '../logger/index.js'

export interface WorkerPoolOptions {
  concurrency: number
  totalTasks: number
}

export type TaskFunction<T> = (
  taskIndex: number,
  workerId: number,
) => Promise<T>

// Worker 池管理器
export class WorkerPool<T> {
  private concurrency: number
  private totalTasks: number
  private taskIndex = 0
  private logger: Logger

  constructor(options: WorkerPoolOptions) {
    this.concurrency = options.concurrency
    this.totalTasks = options.totalTasks
    this.logger = logger
  }

  async execute(taskFunction: TaskFunction<T>): Promise<T[]> {
    const results: T[] = Array.from({ length: this.totalTasks })

    this.logger.main.info(
      `开始并发处理任务，工作池模式，并发数：${this.concurrency}`,
    )

    // Worker 函数
    const worker = async (workerId: number): Promise<void> => {
      const workerLogger = this.logger.worker(workerId)
      workerLogger.start(`Worker ${workerId} 启动`)

      let processedByWorker = 0

      while (this.taskIndex < this.totalTasks) {
        const currentIndex = this.taskIndex++
        if (currentIndex >= this.totalTasks) break

        workerLogger.info(`开始处理任务 ${currentIndex + 1}/${this.totalTasks}`)

        const startTime = Date.now()
        const result = await taskFunction(currentIndex, workerId)
        const duration = Date.now() - startTime

        results[currentIndex] = result
        processedByWorker++

        workerLogger.info(
          `完成任务 ${currentIndex + 1}/${this.totalTasks} - ${duration}ms`,
        )
      }

      workerLogger.success(
        `Worker ${workerId} 完成，处理了 ${processedByWorker} 个任务`,
      )
    }

    // 启动工作池
    const workers = Array.from(
      { length: Math.min(this.concurrency, this.totalTasks) },
      (_, i) => worker(i + 1),
    )
    await Promise.all(workers)

    return results
  }
}
