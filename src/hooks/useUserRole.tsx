import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "faculty" | "recruiter" | "user";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRole(null);
          setIsLoading(false);
          return;
        }

        // Fetch user's primary role from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching role:', error);
          setRole('user'); // Default to user role
        } else {
          setRole(data.role as AppRole);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (checkRole: AppRole) => {
    return role === checkRole || role === 'admin';
  };

  const hasAnyRole = (checkRoles: AppRole[]) => {
    return role ? checkRoles.includes(role) || role === 'admin' : false;
  };

  return { role, isLoading, hasRole, hasAnyRole };
}
