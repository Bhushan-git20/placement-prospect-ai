import { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Briefcase, 
  BarChart3, 
  BookOpen, 
  MessageSquare,
  Settings,
  Database,
  Target,
  Award,
  LogOut,
  User,
  GraduationCap,
  Brain
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles: string[];
  color: string;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["admin", "faculty", "recruiter", "user"], color: "primary" },
  { title: "User Management", url: "/users", icon: Settings, roles: ["admin"], color: "accent" },
  { title: "Student Profiles", url: "/students", icon: Users, roles: ["admin", "faculty"], color: "cyan" },
  { title: "Job Market", url: "/jobs", icon: Briefcase, roles: ["admin", "recruiter"], color: "orange" },
  { title: "Skill Analytics", url: "/skills", icon: BarChart3, roles: ["admin", "faculty"], color: "success" },
  { title: "Advanced Analytics", url: "/advanced-analytics", icon: Brain, roles: ["admin", "faculty"], color: "info" },
  { title: "Practice Center", url: "/assessments", icon: BookOpen, roles: ["admin", "faculty", "user"], color: "pink" },
  { title: "My Assessments", url: "/my-assessments", icon: GraduationCap, roles: ["user"], color: "pink" },
  { title: "AI Career Coach", url: "/career-coach", icon: MessageSquare, roles: ["admin", "user"], color: "info" },
  { title: "Candidate Search", url: "/candidates", icon: Target, roles: ["admin", "recruiter"], color: "warning" },
  { title: "Data Management", url: "/data", icon: Database, roles: ["admin", "faculty"], color: "secondary" },
];

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const { role, isLoading: roleLoading } = useUserRole();
  const currentPath = location.pathname;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user && role && !roleLoading) {
      setUser({ ...user, role });
    }
  }, [role, roleLoading, user?.id]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', authUser.id)
          .single();
        
        if (profile) {
          setUser({ ...profile, role: role || 'user' });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of PlacePredict.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => currentPath === path;
  
  const filteredMenuItems = menuItems.filter(item => {
    const userRole = user?.role || role || 'user';
    return item.roles.includes(userRole);
  });

  const getNavClassName = (path: string, color: string) => {
    const colorMap: Record<string, string> = {
      primary: "bg-gradient-primary text-white shadow-glow font-medium",
      cyan: "bg-gradient-to-r from-brand-cyan/20 to-brand-cyan/10 text-brand-cyan border-l-4 border-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.3)] font-medium",
      orange: "bg-gradient-to-r from-brand-orange/20 to-brand-orange/10 text-brand-orange border-l-4 border-brand-orange shadow-[0_0_15px_rgba(251,146,60,0.3)] font-medium",
      pink: "bg-gradient-to-r from-brand-pink/20 to-brand-pink/10 text-brand-pink border-l-4 border-brand-pink shadow-[0_0_15px_rgba(236,72,153,0.3)] font-medium",
      success: "bg-gradient-to-r from-success/20 to-success/10 text-success border-l-4 border-success shadow-[0_0_15px_rgba(34,197,94,0.3)] font-medium",
      info: "bg-gradient-to-r from-info/20 to-info/10 text-info border-l-4 border-info shadow-[0_0_15px_rgba(59,130,246,0.3)] font-medium",
      warning: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-l-4 border-warning shadow-[0_0_15px_rgba(234,179,8,0.3)] font-medium",
      secondary: "bg-gradient-to-r from-secondary/20 to-secondary/10 text-secondary-foreground border-l-4 border-secondary font-medium",
      accent: "bg-gradient-to-r from-accent/20 to-accent/10 text-accent-foreground border-l-4 border-accent font-medium",
    };
    return isActive(path) 
      ? colorMap[color] || "bg-sidebar-accent text-sidebar-accent-foreground font-medium glow-primary" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1 transition-all duration-300";
  };

  return (
    <Sidebar className={`glass-nav ${collapsed ? "w-14" : "w-64"} border-r-0`}>
      <SidebarContent className="p-0">
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold gradient-text">PlacePredict</h1>
                <p className="text-xs text-muted-foreground">AI Career Insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1 p-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={getNavClassName(item.url, item.color)}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg text-left"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user && (
          <div className={`space-y-3 ${collapsed ? "flex flex-col items-center" : ""}`}>
            <div className={`flex items-center space-x-3 ${collapsed ? "flex-col space-x-0 space-y-2" : ""}`}>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="gradient-primary text-white">
                  {user.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className="w-full hover:bg-destructive/10 hover:text-destructive transition-smooth"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}