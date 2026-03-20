const express = require('express');
const router = express.Router();

// AI Summary Generation using Groq API
router.post('/generate-summary', async (req, res) => {
    try {
        const { chapterName, chapterDescription, subject } = req.body;

        if (!chapterName || !chapterDescription) {
            return res.status(400).json({
                success: false,
                error: 'Chapter name and description are required'
            });
        }

        const prompt = `Generate a comprehensive summary for CBSE Class 10 ${subject} chapter "${chapterName}". 
        
        Include:
        1. A clear overview of the chapter (2-3 sentences)
        2. 5-7 key concepts students must understand
        3. Important points for exam preparation
        4. Real-world applications and examples
        5. Tips for better understanding
        
        Format the response in clean HTML with proper headings and bullet points. Make it engaging and easy to understand for Class 10 students.
        
        Chapter Description: ${chapterDescription}`;

        const response = await fetch(process.env.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert CBSE Class 10 teacher who creates engaging and comprehensive chapter summaries. Always format your response in clean HTML with proper structure.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const aiSummary = data.choices[0].message.content;

        res.json({
            success: true,
            summary: aiSummary
        });

    } catch (error) {
        console.error('AI Summary generation error:', error);
        
        // Fallback to static summary
        const fallbackSummary = generateFallbackSummary(req.body.chapterName, req.body.chapterDescription);
        
        res.json({
            success: true,
            summary: fallbackSummary,
            fallback: true
        });
    }
});

// Generate fallback summary when AI fails
function generateFallbackSummary(chapterName, chapterDescription) {
    return `
        <h4>📚 Chapter Overview</h4>
        <p>${chapterDescription}</p>
        
        <h4>🎯 Key Learning Objectives</h4>
        <ul>
            <li>Understand the fundamental concepts of ${chapterName}</li>
            <li>Learn the practical applications and real-world examples</li>
            <li>Master the important formulas and definitions</li>
            <li>Practice problem-solving techniques</li>
            <li>Prepare for CBSE examination questions</li>
        </ul>
        
        <h4>💡 Study Tips</h4>
        <ul>
            <li>Read the chapter thoroughly and make notes</li>
            <li>Practice numerical problems regularly</li>
            <li>Understand concepts rather than memorizing</li>
            <li>Relate topics to everyday life examples</li>
            <li>Solve previous year questions</li>
        </ul>
        
        <h4>🔬 Exam Preparation</h4>
        <p>Focus on understanding the core concepts, practice diagrams if applicable, and solve sample questions to excel in your CBSE Class 10 examination.</p>
    `;
}

module.exports = router;