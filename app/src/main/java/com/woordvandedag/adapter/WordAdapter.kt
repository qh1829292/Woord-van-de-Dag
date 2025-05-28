package com.woordvandedag.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.woordvandedag.R
import com.woordvandedag.model.DutchWord

class WordAdapter : RecyclerView.Adapter<WordAdapter.WordViewHolder>() {
    private var words: List<DutchWord> = emptyList()

    fun submitList(newWords: List<DutchWord>) {
        words = newWords
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): WordViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_word, parent, false)
        return WordViewHolder(view)
    }

    override fun onBindViewHolder(holder: WordViewHolder, position: Int) {
        holder.bind(words[position])
    }

    override fun getItemCount(): Int = words.size

    class WordViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val wordText: TextView = itemView.findViewById(R.id.itemWordText)
        private val pronunciationText: TextView = itemView.findViewById(R.id.itemPronunciationText)
        private val definitionText: TextView = itemView.findViewById(R.id.itemDefinitionText)
        private val exampleText: TextView = itemView.findViewById(R.id.itemExampleText)

        fun bind(word: DutchWord) {
            wordText.text = word.word
            pronunciationText.text = word.pronunciation
            definitionText.text = word.definition
            exampleText.text = word.example
        }
    }
} 