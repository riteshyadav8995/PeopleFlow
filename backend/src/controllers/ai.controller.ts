import { Request, Response } from 'express';

// Simulated AI responses since no real API key is provided yet
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    // Simple simulated rule-based AI for demonstration
    let reply = "I'm sorry, I don't quite understand. Could you please rephrase?";
    const msg = message.toLowerCase();

    if (msg.includes('leave') || msg.includes('holiday')) {
      reply = "You currently have 8 Casual Leaves and 5 Sick Leaves available. Your next company holiday is on November 15th.";
    } else if (msg.includes('salary') || msg.includes('payslip') || msg.includes('pay')) {
      reply = "Your last payslip for October 2024 has been generated. You can view your detailed salary structure in the Payroll section.";
    } else if (msg.includes('policy') || msg.includes('rules')) {
      reply = "You can find all company policies, including the Code of Conduct and Remote Work guidelines, in the Help -> Company Policies section.";
    } else if (msg.includes('hello') || msg.includes('hi')) {
      reply = "Hello there! How can I assist you with your HR needs today?";
    }

    // Simulate network delay
    setTimeout(() => {
      res.status(200).json({ success: true, reply });
    }, 1000);

  } catch (error) {
    res.status(500).json({ success: false, message: 'AI Processing failed' });
  }
};

export const handleVoice = async (req: Request, res: Response) => {
  try {
    // In a real app, this would process req.body.audioData through Whisper API
    
    // Simulate processing delay
    setTimeout(() => {
      res.status(200).json({ 
        success: true, 
        reply: "Based on your request, I've checked your balance. You have enough casual leaves available for next month. Would you like me to open the Apply Leave form for you?" 
      });
    }, 1500);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Voice Processing failed' });
  }
};
