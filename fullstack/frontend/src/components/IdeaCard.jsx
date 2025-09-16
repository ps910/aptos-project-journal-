import React from 'react'

export default function IdeaCard({ idea, onVote }) {
  return (
    <div className="idea card">
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <div className="meta">
        <span>Votes: {idea.votes}</span>
        <button onClick={() => onVote(idea.id)}>Vote</button>
      </div>
    </div>
  )
}
