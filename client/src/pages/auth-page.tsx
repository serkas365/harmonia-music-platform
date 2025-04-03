import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Redirect, Link, useLocation } from "wouter";
import { Apple, Facebook, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";

// Define new form schemas for Firebase
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { appUser, isLoading, isAuthenticating, login, register, loginWithGoogle } = useFirebaseAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup login form with Firebase schema
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Setup register form with Firebase schema
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Get standard auth state
  const { user, isLoading: authLoading } = useAuth();
  
  // Effect for successful authentication - immediately redirect to home
  useEffect(() => {
    if (appUser || user) {
      toast({
        title: "Welcome to Harmonia",
        description: `Successfully logged in as ${appUser?.displayName || user?.displayName || 'user'}`,
      });
      navigate('/');
    }
  }, [appUser, user, navigate, toast]);
  
  // Handle login submission
  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // The app will redirect when the auth changes in the effect above
      
      // Display a message while waiting for authentication to complete
      toast({
        title: "Logging in...",
        description: "Preparing your music experience",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle register submission
  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await register(data.email, data.password, data.username);
      // The app will redirect when the auth changes in the effect above
      
      // Display a message while waiting for registration to complete
      toast({
        title: "Creating account...",
        description: "Setting up your Harmonia experience",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // The app will redirect via popup/redirect flow
      
      toast({
        title: "Google authentication in progress...",
        description: "You'll be redirected to continue",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Google login failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // If already authenticated, avoid flicker by returning null while the effect redirects
  if (appUser || user) {
    return null;
  }

  // Common loading state between both auth systems
  const isGlobalLoading = isLoading || authLoading;
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Form Section */}
      <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex items-center mb-8">
            <svg className="h-10 w-10 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="hsl(var(--primary))" strokeWidth="2"/>
              <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="hsl(var(--primary))"/>
            </svg>
            <h1 className="text-3xl font-bold">Harmonia</h1>
            
            {/* Authentication status indicator */}
            {isAuthenticating && (
              <div className="ml-auto flex items-center bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full border border-border/40 shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin mr-2 text-primary" />
                <span className="text-xs font-medium">Authenticating...</span>
              </div>
            )}
          </div>

          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label htmlFor="remember" className="text-sm text-muted-foreground">
                        {t('auth.rememberMe')}
                      </label>
                    </div>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t('auth.signIn')}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.email')}</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.username')}</FormLabel>
                        <FormControl>
                          <Input placeholder="your_username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t('auth.signUp')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex justify-center items-center" 
                onClick={handleGoogleLogin}
                type="button"
              >
                <FcGoogle className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="flex justify-center items-center" 
                disabled 
                type="button"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
              </Button>
              <Button 
                variant="outline" 
                className="flex justify-center items-center" 
                disabled 
                type="button"
              >
                <Apple className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.termsAndPrivacy')}
              {' '}
              <Link href="/terms" className="text-primary hover:underline">
                {t('auth.terms')}
              </Link>
              {' '}{t('common.and')}{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                {t('auth.privacy')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-primary/20 to-background">
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <svg className="h-20 w-20 mx-auto mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="hsl(var(--primary))" strokeWidth="2"/>
              <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="hsl(var(--primary))"/>
            </svg>
            <h2 className="text-3xl font-bold mb-4">Welcome to Harmonia</h2>
            <p className="text-muted-foreground mb-6">
              The premium music streaming platform that combines subscription streaming, 
              digital purchases, and artist social media integration in one beautiful experience.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-background-elevated p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Stream</h3>
                <p className="text-sm text-muted-foreground">Unlimited access to millions of songs in high quality</p>
              </div>
              <div className="bg-background-elevated p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Buy</h3>
                <p className="text-sm text-muted-foreground">Purchase your favorite music to own forever</p>
              </div>
              <div className="bg-background-elevated p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Connect</h3>
                <p className="text-sm text-muted-foreground">Follow artists across all their social platforms</p>
              </div>
              <div className="bg-background-elevated p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Discover</h3>
                <p className="text-sm text-muted-foreground">Find new music with personalized recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
