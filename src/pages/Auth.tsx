import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Loader2, Mail, Lock, User, UserCheck, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "faculty", "recruiter", "admin"]),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),  
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type SignInErrors = { email?: string; password?: string };
type SignUpErrors = { full_name?: string; email?: string; password?: string; role?: string };

type AuthView = 'signin' | 'signup' | 'forgot-password' | 'reset-success';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [signInErrors, setSignInErrors] = useState<SignInErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user" as "user" | "faculty" | "recruiter" | "admin",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const triggerShake = (fields: string[]) => {
    const newShake: Record<string, boolean> = {};
    fields.forEach(f => newShake[f] = true);
    setShakeFields(newShake);
    setTimeout(() => setShakeFields({}), 500);
  };

  const clearSignInError = (field: keyof SignInErrors) => {
    setSignInErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const clearSignUpError = (field: keyof SignUpErrors) => {
    setSignUpErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    setIsLoading(true);

    try {
      const validatedData = signInSchema.parse(signInForm);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setSignInErrors({ email: "Invalid credentials", password: "Invalid credentials" });
          triggerShake(['signin-email', 'signin-password']);
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed into PlacePredict.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: SignInErrors = {};
        const errorFields: string[] = [];
        error.errors.forEach(err => {
          const field = err.path[0] as keyof SignInErrors;
          fieldErrors[field] = err.message;
          errorFields.push(`signin-${field}`);
        });
        setSignInErrors(fieldErrors);
        triggerShake(errorFields);
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    setIsLoading(true);

    try {
      const validatedData = signUpSchema.parse(signUpForm);
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: validatedData.full_name,
          }
        }
      });

      if (data.user && !error) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: validatedData.role
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }
      }

      if (error) {
        if (error.message.includes('User already registered')) {
          setSignUpErrors({ email: "Account already exists" });
          triggerShake(['signup-email']);
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setActiveTab("signin");
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Account created successfully!",
        description: "Welcome to PlacePredict. You're now signed in.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: SignUpErrors = {};
        const errorFields: string[] = [];
        error.errors.forEach(err => {
          const field = err.path[0] as keyof SignUpErrors;
          fieldErrors[field] = err.message;
          errorFields.push(`signup-${field}`);
        });
        setSignUpErrors(fieldErrors);
        triggerShake(errorFields);
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetEmailError("");
    setIsLoading(true);

    try {
      const validated = resetPasswordSchema.parse({ email: resetEmail });

      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setAuthView('reset-success');
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setResetEmailError(error.errors[0].message);
        triggerShake(['reset-email']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldId: string, hasError: boolean) => {
    const baseClass = "transition-all duration-200 focus:glow-primary";
    if (hasError) {
      return `${baseClass} input-error ${shakeFields[fieldId] ? 'animate-shake' : ''}`;
    }
    return baseClass;
  };

  // Forgot Password View
  if (authView === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">PlacePredict</h1>
            <p className="text-muted-foreground">Reset your password</p>
          </div>

          <Card className="glass-card glow-hover">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Forgot Password</CardTitle>
              <CardDescription className="text-sm">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetEmailError("");
                    }}
                    disabled={isLoading}
                    className={getInputClassName('reset-email', !!resetEmailError)}
                    required
                  />
                  {resetEmailError && (
                    <p className="error-message">
                      <AlertCircle className="w-3 h-3" />
                      {resetEmailError}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary glow-hover transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthView('signin')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Success View
  if (authView === 'reset-success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Check Your Email</h1>
            <p className="text-muted-foreground">We've sent password reset instructions to:</p>
            <p className="font-medium mt-2">{resetEmail}</p>
          </div>

          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  setAuthView('signin');
                  setResetEmail("");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">PlacePredict</h1>
          <p className="text-muted-foreground">AI-Powered Placement Analysis System</p>
        </div>

        <Card className="glass-card glow-hover">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription className="text-sm">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="transition-smooth">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="transition-smooth">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInForm.email}
                      onChange={(e) => {
                        setSignInForm(prev => ({ ...prev, email: e.target.value }));
                        clearSignInError('email');
                      }}
                      disabled={isLoading}
                      className={getInputClassName('signin-email', !!signInErrors.email)}
                      required
                    />
                    {signInErrors.email && (
                      <p className="error-message">
                        <AlertCircle className="w-3 h-3" />
                        {signInErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInForm.password}
                      onChange={(e) => {
                        setSignInForm(prev => ({ ...prev, password: e.target.value }));
                        clearSignInError('password');
                      }}
                      disabled={isLoading}
                      className={getInputClassName('signin-password', !!signInErrors.password)}
                      required
                    />
                    {signInErrors.password && (
                      <p className="error-message">
                        <AlertCircle className="w-3 h-3" />
                        {signInErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm p-0 h-auto text-primary"
                      onClick={() => setAuthView('forgot-password')}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary glow-hover transition-smooth"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpForm.full_name}
                      onChange={(e) => {
                        setSignUpForm(prev => ({ ...prev, full_name: e.target.value }));
                        clearSignUpError('full_name');
                      }}
                      disabled={isLoading}
                      className={getInputClassName('signup-full_name', !!signUpErrors.full_name)}
                      required
                    />
                    {signUpErrors.full_name && (
                      <p className="error-message">
                        <AlertCircle className="w-3 h-3" />
                        {signUpErrors.full_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpForm.email}
                      onChange={(e) => {
                        setSignUpForm(prev => ({ ...prev, email: e.target.value }));
                        clearSignUpError('email');
                      }}
                      disabled={isLoading}
                      className={getInputClassName('signup-email', !!signUpErrors.email)}
                      required
                    />
                    {signUpErrors.email && (
                      <p className="error-message">
                        <AlertCircle className="w-3 h-3" />
                        {signUpErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      value={signUpForm.password}
                      onChange={(e) => {
                        setSignUpForm(prev => ({ ...prev, password: e.target.value }));
                        clearSignUpError('password');
                      }}
                      disabled={isLoading}
                      className={getInputClassName('signup-password', !!signUpErrors.password)}
                      required
                    />
                    {signUpErrors.password && (
                      <p className="error-message">
                        <AlertCircle className="w-3 h-3" />
                        {signUpErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role" className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Role
                    </Label>
                    <Select
                      value={signUpForm.role}
                      onValueChange={(value: "user" | "faculty" | "recruiter" | "admin") => 
                        setSignUpForm(prev => ({ ...prev, role: value }))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="transition-smooth focus:glow-primary">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="user">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary glow-hover transition-smooth"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}