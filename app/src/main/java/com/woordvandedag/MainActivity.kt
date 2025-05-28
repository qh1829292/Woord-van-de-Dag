package com.woordvandedag

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.woordvandedag.adapter.WordAdapter
import com.woordvandedag.databinding.ActivityMainBinding
import com.woordvandedag.model.DutchWord
import com.woordvandedag.notification.NotificationService
import com.woordvandedag.repository.WordRepository
import com.woordvandedag.worker.DailyWordWorker
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var wordRepository: WordRepository
    private lateinit var notificationService: NotificationService
    private lateinit var wordAdapter: WordAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupDependencies()
        setupRecyclerView()
        setupDailyWordWorker()
        updateUI()
    }

    private fun setupDependencies() {
        wordRepository = WordRepository(this)
        notificationService = NotificationService(this)
        wordAdapter = WordAdapter()
    }

    private fun setupRecyclerView() {
        binding.previousWordsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = wordAdapter
        }
    }

    private fun setupDailyWordWorker() {
        val dailyWorkRequest = PeriodicWorkRequestBuilder<DailyWordWorker>(
            24, TimeUnit.HOURS
        ).build()

        WorkManager.getInstance(this).enqueue(dailyWorkRequest)
    }

    private fun updateUI() {
        val wordOfDay = wordRepository.getWordOfTheDay()
        wordOfDay?.let { updateWordOfDayCard(it) }
        
        val previousWords = wordRepository.getPreviousWords()
        wordAdapter.submitList(previousWords)
    }

    private fun updateWordOfDayCard(word: DutchWord) {
        binding.apply {
            wordText.text = word.word
            pronunciationText.text = word.pronunciation
            definitionText.text = word.definition
            exampleText.text = word.example
        }
    }
} 