'use client';
import React from 'react';
import MentalHealthChat from './MentalHealthChat';

export default function MentalHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Mental Health Research Chatbot</h1>
        <p className="mb-6 text-gray-700">Ask any mental health question and get evidence-based answers from recent research. This tool is for educational purposes only and does not replace professional advice.</p>
        <MentalHealthChat />
      </div>
    </div>
  );
} 