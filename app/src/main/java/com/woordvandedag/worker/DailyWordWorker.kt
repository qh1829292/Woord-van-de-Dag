package com.woordvandedag.worker

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.woordvandedag.notification.NotificationService
import com.woordvandedag.repository.WordRepository

class DailyWordWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    private val wordRepository = WordRepository(context)
    private val notificationService = NotificationService(context)

    override fun doWork(): Result {
        val wordOfDay = wordRepository.getWordOfTheDay()
        
        return if (wordOfDay != null) {
            notificationService.showWordNotification(wordOfDay)
            wordRepository.moveToNextWord()
            Result.success()
        } else {
            Result.failure()
        }
    }
} 