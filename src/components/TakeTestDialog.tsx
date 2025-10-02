import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TakeTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  onTestCompleted: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const questionBank: Record<string, Question[]> = {
  "Technical Skills": [
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
      correctAnswer: 0
    },
    {
      question: "Which of the following is NOT a programming language?",
      options: ["Python", "JavaScript", "HTML", "Java"],
      correctAnswer: 2
    },
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1
    },
    {
      question: "Which data structure uses LIFO?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1
    },
    {
      question: "What does API stand for?",
      options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Integration", "Automated Programming Interface"],
      correctAnswer: 0
    }
  ],
  "Aptitude": [
    {
      question: "If a train travels 60 km in 40 minutes, what is its speed in km/h?",
      options: ["80 km/h", "90 km/h", "100 km/h", "120 km/h"],
      correctAnswer: 1
    },
    {
      question: "What is 15% of 200?",
      options: ["25", "30", "35", "40"],
      correctAnswer: 1
    },
    {
      question: "If 5 workers can complete a task in 10 days, how many days will 10 workers take?",
      options: ["5 days", "10 days", "15 days", "20 days"],
      correctAnswer: 0
    },
    {
      question: "What is the next number in the sequence: 2, 6, 12, 20, ?",
      options: ["28", "30", "32", "36"],
      correctAnswer: 1
    },
    {
      question: "A product costs ₹500 after a 20% discount. What was the original price?",
      options: ["₹600", "₹625", "₹650", "₹700"],
      correctAnswer: 1
    }
  ],
  "Communication": [
    {
      question: "Which of the following is an example of active listening?",
      options: ["Interrupting to share your opinion", "Nodding and maintaining eye contact", "Checking your phone", "Thinking about your response"],
      correctAnswer: 1
    },
    {
      question: "What is the most effective way to handle constructive criticism?",
      options: ["Defend yourself immediately", "Ignore it", "Listen carefully and ask clarifying questions", "Change the subject"],
      correctAnswer: 2
    },
    {
      question: "In professional email writing, which greeting is most appropriate?",
      options: ["Hey!", "Hi there", "Dear Sir/Madam", "Yo"],
      correctAnswer: 2
    },
    {
      question: "What does body language account for in communication effectiveness?",
      options: ["10%", "30%", "55%", "80%"],
      correctAnswer: 2
    },
    {
      question: "Which is the best approach for a group presentation?",
      options: ["One person does all the talking", "Everyone memorizes exact lines", "Coordinate and practice transitions", "Wing it without practice"],
      correctAnswer: 2
    }
  ]
};

export function TakeTestDialog({ open, onOpenChange, category, onTestCompleted }: TakeTestDialogProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [studentInfo, setStudentInfo] = useState({ name: "", studentId: "" });

  const questions = questionBank[category] || [];
  const totalQuestions = questions.length;

  useEffect(() => {
    fetchStudentInfo();
  }, []);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && testStarted) {
      handleSubmit();
    }
  }, [testStarted, timeLeft]);

  const fetchStudentInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      const { data: student } = await supabase
        .from('students')
        .select('student_id')
        .eq('email', user.email)
        .single();

      setStudentInfo({
        name: profile?.full_name || "Student",
        studentId: student?.student_id || "UNKNOWN"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalScore = calculateScore();
    setScore(finalScore);
    const timeTaken = Math.ceil((1800 - timeLeft) / 60);
    const correctAnswers = answers.filter((answer, index) => answer === questions[index].correctAnswer).length;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from('assessments').insert({
        user_id: user.id,
        student_name: studentInfo.name,
        student_id: studentInfo.studentId,
        assessment_type: `${category} Assessment`,
        test_category: category,
        score: finalScore,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        time_taken_minutes: timeTaken,
        time_limit_minutes: 30,
        difficulty_level: "Medium",
        strengths: finalScore >= 80 ? [category, "Problem Solving"] : [],
        areas_of_improvement: finalScore < 60 ? [category, "Practice Required"] : [],
        feedback: finalScore >= 80 ? "Excellent performance!" : finalScore >= 60 ? "Good job, keep practicing!" : "Needs improvement. Focus on fundamentals.",
        recommendations: finalScore < 60 ? ["Review basic concepts", "Practice more questions", "Seek guidance"] : ["Keep up the good work"]
      });

      if (error) throw error;

      toast({
        title: "Test submitted successfully!",
        description: `You scored ${finalScore}%`,
      });

      setShowResults(true);
      onTestCompleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit test",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(1800);
    setTestStarted(false);
    setShowResults(false);
    setScore(0);
  };

  if (!testStarted && !showResults) {
    return (
      <Dialog open={open} onOpenChange={(o) => { resetTest(); onOpenChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{category} Assessment</DialogTitle>
            <DialogDescription>Test your knowledge and skills</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm"><strong>Total Questions:</strong> {totalQuestions}</p>
              <p className="text-sm"><strong>Time Limit:</strong> 30 minutes</p>
              <p className="text-sm"><strong>Passing Score:</strong> 60%</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 font-medium">Instructions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>Answer all questions</li>
                <li>You can navigate between questions</li>
                <li>Timer will start once you begin</li>
                <li>Test will auto-submit when time expires</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { resetTest(); onOpenChange(false); }}>Cancel</Button>
            <Button onClick={() => setTestStarted(true)} className="gradient-primary">
              Start Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResults) {
    const correctAnswers = answers.filter((answer, index) => answer === questions[index].correctAnswer).length;
    return (
      <Dialog open={open} onOpenChange={(o) => { resetTest(); onOpenChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
            <DialogDescription>Here's how you performed</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="text-6xl font-bold gradient-text mb-2">{score}%</div>
              <p className="text-muted-foreground">Your Score</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </Card>
              <Card className="p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{totalQuestions - correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Wrong</p>
              </Card>
              <Card className="p-4 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.ceil((1800 - timeLeft) / 60)}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </Card>
            </div>
            <div className={`p-4 rounded-lg ${score >= 60 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`font-medium ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {score >= 80 ? "🎉 Excellent! You passed with flying colors!" : 
                 score >= 60 ? "✅ Good job! You passed the test." :
                 "❌ Keep practicing. You can retake the test."}
              </p>
            </div>
          </div>
          <Button onClick={() => { resetTest(); onOpenChange(false); }} className="w-full gradient-primary">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!testStarted) { resetTest(); onOpenChange(o); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{category} Assessment</DialogTitle>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {totalQuestions}</span>
              <span>{answers.filter(a => a !== undefined).length} answered</span>
            </div>
            <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
            <RadioGroup 
              value={answers[currentQuestion] !== undefined ? answers[currentQuestion]!.toString() : undefined} 
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            >
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-smooth">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {currentQuestion < totalQuestions - 1 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || answers.filter(a => a !== undefined).length < totalQuestions}
                className="gradient-primary"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
