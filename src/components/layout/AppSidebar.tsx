import { useState, useEffect } from "react";
import { Home, Users, Briefcase, BarChart3, BookOpen, MessageSquare, Settings, Database, Target, Award, LogOut, User, GraduationCap, Brain } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles: string[];
  color: string;
}
const menuItems: MenuItem[] = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: Home,
  roles: ["admin", "faculty", "recruiter", "user"],
  color: "primary"
}, {
  title: "User Management",
  url: "/users",
  icon: Settings,
  roles: ["admin"],
  color: "accent"
}, {
  title: "Student Profiles",
  url: "/students",
  icon: Users,
  roles: ["admin", "faculty"],
  color: "cyan"
}, {
  title: "Job Market",
  url: "/jobs",
  icon: Briefcase,
  roles: ["admin", "recruiter"],
  color: "orange"
}, {
  title: "Skill Analytics",
  url: "/skills",
  icon: BarChart3,
  roles: ["admin", "faculty"],
  color: "success"
}, {
  title: "Advanced Analytics",
  url: "/advanced-analytics",
  icon: Brain,
  roles: ["admin", "faculty"],
  color: "info"
}, {
  title: "Practice Center",
  url: "/assessments",
  icon: BookOpen,
  roles: ["admin", "faculty", "user"],
  color: "pink"
}, {
  title: "My Assessments",
  url: "/my-assessments",
  icon: GraduationCap,
  roles: ["user"],
  color: "pink"
}, {
  title: "AI Career Coach",
  url: "/career-coach",
  icon: MessageSquare,
  roles: ["admin", "user"],
  color: "info"
}, {
  title: "Candidate Search",
  url: "/candidates",
  icon: Target,
  roles: ["admin", "recruiter"],
  color: "warning"
}, {
  title: "Data Management",
  url: "/data",
  icon: Database,
  roles: ["admin", "faculty"],
  color: "secondary"
}];
interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const {
    role,
    isLoading: roleLoading
  } = useUserRole();
  const currentPath = location.pathname;
  useEffect(() => {
    fetchUserProfile();
  }, []);
  useEffect(() => {
    if (user && role && !roleLoading) {
      setUser({
        ...user,
        role
      });
    }
  }, [role, roleLoading, user?.id]);
  const fetchUserProfile = async () => {
    try {
      const {
        data: {
          user: authUser
        }
      } = await supabase.auth.getUser();
      if (authUser) {
        const {
          data: profile
        } = await supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', authUser.id).single();
        if (profile) {
          setUser({
            ...profile,
            role: role || 'user'
          });
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
        description: "You have been logged out of PlacePredict."
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
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
      primary: "bg-gradient-to-r from-[hsl(234,89%,64%)] via-[hsl(260,84%,59%)] to-[hsl(234,89%,64%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(79,70,229,0.5)] font-bold",
      cyan: "bg-gradient-to-r from-[hsl(191,91%,55%)] via-[hsl(191,91%,65%)] to-[hsl(191,91%,55%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(6,182,212,0.5)] font-bold",
      orange: "bg-gradient-to-r from-[hsl(25,95%,53%)] via-[hsl(25,95%,63%)] to-[hsl(25,95%,53%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(251,146,60,0.5)] font-bold",
      pink: "bg-gradient-to-r from-[hsl(330,81%,60%)] via-[hsl(330,81%,70%)] to-[hsl(330,81%,60%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(236,72,153,0.5)] font-bold",
      success: "bg-gradient-to-r from-[hsl(142,76%,36%)] via-[hsl(142,76%,46%)] to-[hsl(142,76%,36%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] font-bold",
      info: "bg-gradient-to-r from-[hsl(199,89%,48%)] via-[hsl(199,89%,58%)] to-[hsl(199,89%,48%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(14,165,233,0.5)] font-bold",
      warning: "bg-gradient-to-r from-[hsl(38,92%,50%)] via-[hsl(38,92%,60%)] to-[hsl(38,92%,50%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(234,179,8,0.5)] font-bold",
      secondary: "bg-gradient-to-r from-[hsl(210,40%,96%)] via-[hsl(220,13%,97%)] to-[hsl(210,40%,96%)] text-[hsl(222,47%,11%)] border-l-4 border-[hsl(234,89%,64%)] shadow-[0_0_20px_rgba(79,70,229,0.3)] font-bold",
      accent: "bg-gradient-to-r from-[hsl(260,84%,59%)] via-[hsl(260,84%,69%)] to-[hsl(260,84%,59%)] text-white border-l-4 border-white/50 shadow-[0_0_20px_rgba(124,58,237,0.5)] font-bold"
    };
    return isActive(path) ? colorMap[color] || "bg-gradient-primary text-white font-bold border-l-4 border-white/50 shadow-glow" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1 transition-all duration-300";
  };
  return <Sidebar className={`glass-nav ${collapsed ? "w-14" : "w-64"} border-r-0`}>
      <SidebarContent className="p-0 bg-gray-500">
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border bg-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <div>
                <h1 className="text-lg font-bold gradient-text">PlacePredict</h1>
                <p className="text-xs font-extrabold text-slate-50">AI Career Insights</p>
              </div>}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1 p-4 bg-slate-400">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2 rounded-none bg-zinc-600">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClassName(item.url, item.color)}>
                    <button onClick={() => navigate(item.url)} className="w-full flex items-center space-x-3 p-3 rounded-lg text-left">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-slate-500">
        {user && <div className={`space-y-3 ${collapsed ? "flex flex-col items-center" : ""}`}>
            <div className={`flex items-center space-x-3 ${collapsed ? "flex-col space-x-0 space-y-2" : ""}`}>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="gradient-primary text-white">
                  {user.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize font-bold">{user.role}</p>
                </div>}
            </div>
            <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={handleSignOut} className="w-full hover:bg-destructive/10 transition-smooth text-red-800">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>}
      </SidebarFooter>
    </Sidebar>;
}