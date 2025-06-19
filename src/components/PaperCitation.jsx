'use client';

import React from 'react';

export default function PaperCitation({ paper }) {
  return (
    <div className="border-b py-2">
      <div className="font-semibold">{paper.title}</div>
      <div className="text-xs text-gray-600 mb-1">{paper.authors} &middot; {paper.journal} &middot; {paper.year}</div>
      <div className="text-sm mb-1">{paper.abstract}</div>
      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">View Paper</a>
      <div className="text-xs text-gray-400 mt-1">Relevance Score: {paper.relevanceScore?.toFixed(2)}</div>
    </div>
  );
} 