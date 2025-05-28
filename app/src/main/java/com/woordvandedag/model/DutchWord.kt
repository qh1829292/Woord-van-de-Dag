package com.woordvandedag.model

data class DutchWord(
    val word: String,
    val definition: String,
    val pronunciation: String,
    val example: String
)

data class WordList(
    val words: List<DutchWord>
) 