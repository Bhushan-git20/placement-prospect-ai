import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Users, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-float">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold gradient-text mb-6">
              PlacePredict
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-Powered Placement Analysis System for Students, Universities, and Recruiters
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-primary glow-hover text-lg px-8 py-4 transition-bounce"
                onClick={() => navigate('/auth')}
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="glass-card text-lg px-8 py-4 hover:bg-secondary/50 transition-smooth"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI-Powered Features</span>
            </div>
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Comprehensive Career Intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Leverage advanced analytics and AI to make data-driven decisions for better placement outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: "Student Analytics",
                description: "Track readiness scores, skill gaps, and get personalized career recommendations",
                gradient: "gradient-primary"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Market Insights",
                description: "Real-time job market analysis and skill demand forecasting",
                gradient: "gradient-secondary"
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "AI Coaching",
                description: "Intelligent career guidance and interview preparation assistance",
                gradient: "gradient-tertiary"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="glass-card card-hover p-8 text-center transition-smooth"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center mx-auto mb-6 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 gradient-text">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold gradient-text mb-12">
            Trusted by Leading Institutions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10k+", label: "Students Analyzed" },
              { value: "500+", label: "Universities" },
              { value: "94%", label: "Accuracy Rate" },
              { value: "23%", label: "Placement Improvement" }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="glass-card glow-primary p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold gradient-text mb-6">
              Ready to Transform Your Career Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students, universities, and recruiters using PlacePredict to make smarter career decisions
            </p>
            <Button 
              size="lg" 
              className="gradient-primary glow-hover text-lg px-12 py-4 transition-bounce"
              onClick={() => navigate('/auth')}
            >
              Start Your Journey
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold gradient-text">PlacePredict</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 PlacePredict. AI-Powered Placement Analysis System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
