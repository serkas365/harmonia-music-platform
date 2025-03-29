import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginData, RegisterData, loginSchema, registerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Redirect, Link } from "wouter";
import { Apple, Facebook, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const AuthPage = () => {
  const { t } = useTranslation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Setup login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Setup register form
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      subscriptionTier: "free",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginData) => {
    loginMutation.mutate(data);
  };

  // Handle register submission
  const onRegisterSubmit = async (data: RegisterData) => {
    registerMutation.mutate(data);
  };

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
                    <Link href="/forgot-password">
                      <a className="text-sm text-primary hover:underline">
                        {t('auth.forgotPassword')}
                      </a>
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
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
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
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
              <Button variant="outline" className="flex justify-center items-center">
                <FcGoogle className="h-5 w-5" />
              </Button>
              <Button variant="outline" className="flex justify-center items-center">
                <Facebook className="h-5 w-5 text-blue-600" />
              </Button>
              <Button variant="outline" className="flex justify-center items-center">
                <Apple className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.termsAndPrivacy')}
              {' '}
              <Link href="/terms">
                <a className="text-primary hover:underline">
                  {t('auth.terms')}
                </a>
              </Link>
              {' '}{t('common.and')}{' '}
              <Link href="/privacy">
                <a className="text-primary hover:underline">
                  {t('auth.privacy')}
                </a>
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
