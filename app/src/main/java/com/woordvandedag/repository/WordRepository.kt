package com.woordvandedag.repository

import android.content.Context
import com.google.gson.Gson
import com.woordvandedag.model.DutchWord
import com.woordvandedag.model.WordList
import java.io.InputStreamReader

class WordRepository(private val context: Context) {
    private var words: List<DutchWord> = emptyList()
    private var currentIndex = 0

    init {
        loadWords()
    }

    private fun loadWords() {
        try {
            context.assets.open("dutch_words.json").use { inputStream ->
                val reader = InputStreamReader(inputStream)
                val wordList = Gson().fromJson(reader, WordList::class.java)
                words = wordList.words
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getWordOfTheDay(): DutchWord? {
        return words.getOrNull(currentIndex)
    }

    fun getPreviousWords(): List<DutchWord> {
        return words.take(currentIndex).reversed()
    }

    fun moveToNextWord() {
        if (currentIndex < words.size - 1) {
            currentIndex++
        }
    }
} 