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

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const questionBank: Record<string, Record<DifficultyLevel, Question[]>> = {
  "Technical Skills": {
    beginner: [
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
        question: "What does API stand for?",
        options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Integration", "Automated Programming Interface"],
        correctAnswer: 0
      },
      {
        question: "Which protocol is used for secure communication over the internet?",
        options: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correctAnswer: 2
      }
    ],
    intermediate: [
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
        question: "Which language is known for building Android apps?",
        options: ["Swift", "Kotlin", "Ruby", "PHP"],
        correctAnswer: 1
      },
      {
        question: "What is the output of 2**3 in Python?",
        options: ["5", "6", "8", "9"],
        correctAnswer: 2
      }
    ],
    advanced: [
      {
        question: "What is the purpose of a virtual DOM in React?",
        options: ["To store data", "To optimize rendering performance", "To handle routing", "To manage state"],
        correctAnswer: 1
      },
      {
        question: "Which design pattern is used in Redux?",
        options: ["MVC", "Flux", "Observer", "Singleton"],
        correctAnswer: 1
      },
      {
        question: "What is the difference between TCP and UDP?",
        options: ["TCP is faster", "UDP is connection-oriented", "TCP guarantees delivery", "UDP is more reliable"],
        correctAnswer: 2
      },
      {
        question: "What is a closure in JavaScript?",
        options: ["A loop structure", "A function with access to outer scope", "A type of array", "A class method"],
        correctAnswer: 1
      }
    ]
  },
  "DSA": {
    beginner: [
      {
        question: "Which data structure uses LIFO?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: 1
      },
      {
        question: "What is the time complexity of accessing an element in an array by index?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
        correctAnswer: 2
      },
      {
        question: "Which data structure is used for BFS traversal?",
        options: ["Stack", "Queue", "Heap", "Tree"],
        correctAnswer: 1
      },
      {
        question: "What is the best case time complexity of Binary Search?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: 0
      }
    ],
    intermediate: [
      {
        question: "What is the worst-case time complexity of Quick Sort?",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        correctAnswer: 1
      },
      {
        question: "What is the space complexity of recursion?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        correctAnswer: 1
      },
      {
        question: "In which data structure is the insertion at the beginning O(1)?",
        options: ["Array", "Linked List", "Binary Tree", "Hash Table"],
        correctAnswer: 1
      },
      {
        question: "Which sorting algorithm is stable?",
        options: ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"],
        correctAnswer: 2
      }
    ],
    advanced: [
      {
        question: "What is the maximum number of edges in a complete graph with n vertices?",
        options: ["n", "n-1", "n(n-1)/2", "n²"],
        correctAnswer: 2
      },
      {
        question: "Which traversal of a tree gives elements in sorted order in BST?",
        options: ["Preorder", "Inorder", "Postorder", "Level order"],
        correctAnswer: 1
      },
      {
        question: "What is the height of a balanced binary tree with n nodes?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctAnswer: 1
      },
      {
        question: "Which algorithm uses the divide and conquer approach?",
        options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
        correctAnswer: 2
      }
    ]
  },
  "Aptitude": {
    beginner: [
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
        question: "What is 25% of 25% of 400?",
        options: ["20", "25", "30", "35"],
        correctAnswer: 1
      },
      {
        question: "A car travels 150 km in 3 hours. What is its average speed?",
        options: ["40 km/h", "45 km/h", "50 km/h", "55 km/h"],
        correctAnswer: 2
      }
    ],
    intermediate: [
      {
        question: "If a train travels 60 km in 40 minutes, what is its speed in km/h?",
        options: ["80 km/h", "90 km/h", "100 km/h", "120 km/h"],
        correctAnswer: 1
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
      },
      {
        question: "If A is twice as fast as B, and together they complete a work in 12 days, how many days will B alone take?",
        options: ["18 days", "24 days", "30 days", "36 days"],
        correctAnswer: 3
      }
    ],
    advanced: [
      {
        question: "A boat travels 30 km upstream and 44 km downstream in 10 hours. In 13 hours, it can travel 40 km upstream and 55 km downstream. What is the speed of the boat in still water?",
        options: ["6 km/h", "8 km/h", "10 km/h", "12 km/h"],
        correctAnswer: 1
      },
      {
        question: "If the sum of ages of 5 children born at intervals of 3 years is 50 years, what is the age of the youngest child?",
        options: ["2 years", "4 years", "6 years", "8 years"],
        correctAnswer: 1
      },
      {
        question: "A man can row 40 km upstream and 55 km downstream in 13 hours. Also, he can row 30 km upstream and 44 km downstream in 10 hours. What is the speed of the stream?",
        options: ["2 km/h", "3 km/h", "4 km/h", "5 km/h"],
        correctAnswer: 1
      },
      {
        question: "The ratio of ages of A and B is 3:5. After 10 years, the ratio will be 5:7. What is A's current age?",
        options: ["15 years", "20 years", "25 years", "30 years"],
        correctAnswer: 0
      }
    ]
  },
  "Communication": {
    beginner: [
      {
        question: "Which of the following is an example of active listening?",
        options: ["Interrupting to share your opinion", "Nodding and maintaining eye contact", "Checking your phone", "Thinking about your response"],
        correctAnswer: 1
      },
      {
        question: "In professional email writing, which greeting is most appropriate?",
        options: ["Hey!", "Hi there", "Dear Sir/Madam", "Yo"],
        correctAnswer: 2
      },
      {
        question: "What is the most important aspect of effective communication?",
        options: ["Speaking loudly", "Using complex vocabulary", "Clarity and understanding", "Speed of delivery"],
        correctAnswer: 2
      },
      {
        question: "What is the best way to give feedback?",
        options: ["Be vague to avoid hurting feelings", "Focus on the behavior, not the person", "Only point out negatives", "Wait until it becomes a big issue"],
        correctAnswer: 1
      }
    ],
    intermediate: [
      {
        question: "What is the most effective way to handle constructive criticism?",
        options: ["Defend yourself immediately", "Ignore it", "Listen carefully and ask clarifying questions", "Change the subject"],
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
      },
      {
        question: "How should you handle disagreements in a professional setting?",
        options: ["Avoid the person", "Raise your voice", "Listen and find common ground", "Ignore the issue"],
        correctAnswer: 2
      }
    ],
    advanced: [
      {
        question: "How do you effectively communicate bad news to stakeholders?",
        options: ["Delay as long as possible", "Be direct, provide context, and offer solutions", "Blame others", "Send an email and avoid discussion"],
        correctAnswer: 1
      },
      {
        question: "What is the best approach for cross-cultural communication?",
        options: ["Assume everyone thinks like you", "Be aware of cultural differences and adapt", "Speak louder", "Use more jargon"],
        correctAnswer: 1
      },
      {
        question: "How should you handle a difficult conversation with a colleague?",
        options: ["Avoid it completely", "Prepare, choose the right time, and focus on facts", "Send a passive-aggressive email", "Involve others immediately"],
        correctAnswer: 1
      },
      {
        question: "What is the most effective way to influence others?",
        options: ["Use authority", "Build trust and present logical arguments", "Repeat yourself loudly", "Threaten consequences"],
        correctAnswer: 1
      }
    ]
  },
  "Mock Interview": {
    beginner: [
      {
        question: "Tell me about yourself.",
        options: ["Talk about personal life only", "Share professional background and relevant skills", "Read your resume word by word", "Say you don't know"],
        correctAnswer: 1
      },
      {
        question: "Why do you want to work for our company?",
        options: ["For the high salary", "Because it's close to home", "I admire your values and see growth opportunities", "I need any job right now"],
        correctAnswer: 2
      },
      {
        question: "What are your strengths?",
        options: ["I don't have any", "List irrelevant personal traits", "Mention relevant skills with examples", "Say you're perfect at everything"],
        correctAnswer: 2
      },
      {
        question: "Do you have any questions for us?",
        options: ["No, I'm good", "What's the salary?", "What are the team dynamics and growth opportunities?", "When can I take vacation?"],
        correctAnswer: 2
      }
    ],
    intermediate: [
      {
        question: "What is your greatest weakness?",
        options: ["I'm a perfectionist", "I work too hard", "I'm learning time management and using tools to improve", "I don't have any weaknesses"],
        correctAnswer: 2
      },
      {
        question: "Where do you see yourself in 5 years?",
        options: ["In your position", "Running my own company", "Growing within the company with increased responsibilities", "I don't know"],
        correctAnswer: 2
      },
      {
        question: "How do you handle stress and pressure?",
        options: ["I avoid stressful situations", "I prioritize tasks and take breaks when needed", "I let it affect my work", "I ignore it"],
        correctAnswer: 1
      },
      {
        question: "Why should we hire you?",
        options: ["Because I applied", "I'm desperate for this job", "My skills align with your needs and I'm passionate about contributing", "I'm the best candidate"],
        correctAnswer: 2
      }
    ],
    advanced: [
      {
        question: "Tell me about a time you failed and what you learned from it.",
        options: ["I never fail", "I missed a deadline but learned to plan better and communicate early", "I blame others", "I don't remember any failures"],
        correctAnswer: 1
      },
      {
        question: "How do you work in a team?",
        options: ["I prefer working alone", "I collaborate, listen, and contribute ideas", "I let others do the work", "I take charge and tell everyone what to do"],
        correctAnswer: 1
      },
      {
        question: "What are your salary expectations?",
        options: ["The highest you can offer", "Based on industry standards and my experience, I'm looking for X range", "Whatever you think is fair", "I don't care about money"],
        correctAnswer: 1
      },
      {
        question: "How do you handle criticism?",
        options: ["I get defensive", "I view it as an opportunity to learn and improve", "I ignore it", "I take it personally"],
        correctAnswer: 1
      }
    ]
  }
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
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);

  const questions = selectedLevel && questionBank[category] ? questionBank[category][selectedLevel] : [];
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
    setSelectedLevel(null);
  };

  // Reset test when dialog opens or category changes
  useEffect(() => {
    if (open) {
      resetTest();
    }
  }, [open, category]);

  if (!testStarted && !showResults) {
    if (!selectedLevel) {
      return (
        <Dialog open={open} onOpenChange={(o) => { resetTest(); onOpenChange(o); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{category} Assessment</DialogTitle>
              <DialogDescription>Select difficulty level</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium">Choose your difficulty level:</p>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start hover:border-primary"
                  onClick={() => setSelectedLevel("beginner")}
                >
                  <span className="font-semibold text-green-600">Beginner</span>
                  <span className="text-xs text-muted-foreground mt-1">Foundational concepts and basics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start hover:border-primary"
                  onClick={() => setSelectedLevel("intermediate")}
                >
                  <span className="font-semibold text-blue-600">Intermediate</span>
                  <span className="text-xs text-muted-foreground mt-1">Moderate complexity and problem-solving</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start hover:border-primary"
                  onClick={() => setSelectedLevel("advanced")}
                >
                  <span className="font-semibold text-purple-600">Advanced</span>
                  <span className="text-xs text-muted-foreground mt-1">Complex scenarios and expert knowledge</span>
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => { resetTest(); onOpenChange(false); }}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={(o) => { resetTest(); onOpenChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{category} Assessment - {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}</DialogTitle>
            <DialogDescription>Test your knowledge and skills</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm"><strong>Difficulty Level:</strong> {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}</p>
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
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setSelectedLevel(null)}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { resetTest(); onOpenChange(false); }}>Cancel</Button>
              <Button onClick={() => setTestStarted(true)} className="gradient-primary">
                Start Test
              </Button>
            </div>
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
              key={currentQuestion}
              value={answers[currentQuestion] !== undefined ? answers[currentQuestion]!.toString() : ""} 
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
