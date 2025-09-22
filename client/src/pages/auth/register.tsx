import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaGoogle } from "react-icons/fa";
import { Loader2, Mail, User, Lock, Check, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Registration form validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  primaryCommunity: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

// Password strength indicator
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const checks = [
    { label: 'At least 12 characters', test: password.length >= 12 },
    { label: 'Uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Number', test: /[0-9]/.test(password) },
    { label: 'Special character', test: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedChecks = checks.filter(check => check.test).length;
  const strength = passedChecks < 3 ? 'weak' : passedChecks < 5 ? 'medium' : 'strong';
  
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={`text-sm font-medium ${
          strength === 'weak' ? 'text-red-500' : 
          strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
        }`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
      </div>
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.test ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-gray-400" />
            )}
            <span className={check.test ? 'text-green-600' : 'text-gray-500'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Register() {
  useDocumentTitle("Sign Up - Shuffle & Sync");
  
  const { signIn, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Form setup
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      primaryCommunity: '',
      acceptTerms: false,
    },
  });

  const password = form.watch('password');

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = () => {
    signIn('google');
  };

  const handleRegister = async (values: RegisterForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          password: values.password,
          primaryCommunity: values.primaryCommunity || 'general',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account before signing in.",
        });
        
        // Redirect to sign-in page with success message
        setTimeout(() => {
          window.location.href = '/auth/signin?message=registration_success';
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tcgCommunities = [
    { value: 'mtg', label: 'Magic: The Gathering' },
    { value: 'pokemon', label: 'Pokemon TCG' },
    { value: 'yugioh', label: 'Yu-Gi-Oh!' },
    { value: 'lorcana', label: 'Disney Lorcana' },
    { value: 'onepiece', label: 'One Piece Card Game' },
    { value: 'general', label: 'General TCG' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            Join the TCG streaming community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Sign Up */}
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center gap-2"
            variant="outline"
            data-testid="button-register-google"
          >
            <FaGoogle className="w-4 h-4" />
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
              </span>
            </div>
          </div>
          
          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="alert-register-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John"
                          data-testid="input-first-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Doe"
                          data-testid="input-last-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="johndoe_tcg"
                        data-testid="input-username"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com"
                        data-testid="input-email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Primary Community */}
              <FormField
                control={form.control}
                name="primaryCommunity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary TCG Community (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-community">
                          <SelectValue placeholder="Select your main TCG interest" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tcgCommunities.map((community) => (
                          <SelectItem key={community.value} value={community.value}>
                            {community.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a strong password"
                        data-testid="input-password"
                        onFocus={() => setShowPasswordRequirements(true)}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {showPasswordRequirements && password && (
                      <PasswordStrengthIndicator password={password} />
                    )}
                  </FormItem>
                )}
              />
              
              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your password"
                        data-testid="input-confirm-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Terms Acceptance */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        I agree to the{' '}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                data-testid="button-register-submit"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
          
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium" data-testid="link-signin">
                Sign in
              </Link>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you'll be able to coordinate collaborative streams, 
            join tournaments, and connect with the TCG community.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}