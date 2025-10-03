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
  User
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
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["admin", "faculty", "recruiter", "user"] },
  { title: "User Management", url: "/users", icon: Settings, roles: ["admin"] },
  { title: "Student Profiles", url: "/students", icon: Users, roles: ["admin", "faculty"] },
  { title: "Job Market", url: "/jobs", icon: Briefcase, roles: ["admin", "recruiter"] },
  { title: "Skill Analytics", url: "/skills", icon: BarChart3, roles: ["admin", "faculty"] },
  { title: "Practice Center", url: "/assessments", icon: BookOpen, roles: ["admin", "faculty", "user"] },
  { title: "AI Career Coach", url: "/career-coach", icon: MessageSquare, roles: ["admin", "user"] },
  { title: "Candidate Search", url: "/candidates", icon: Target, roles: ["admin", "recruiter"] },
  { title: "Data Management", url: "/data", icon: Database, roles: ["admin", "faculty"] },
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

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium glow-primary" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-smooth";
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
                    className={getNavClassName(item.url)}
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