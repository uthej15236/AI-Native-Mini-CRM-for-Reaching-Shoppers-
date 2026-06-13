import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import Button from "../components/ui/Button";
import InputField from "../components/ui/InputField";
import { loginUser } from "../features/auth/authSlice";
import type { LoginFormValues } from "../types/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await dispatch(loginUser(values)).unwrap();
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(String(error));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="glass-card w-full p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Xeno CRM</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Use your account to open the leads workspace and keep the pipeline moving.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <InputField
            label="Password"
            type="password"
            placeholder="Enter password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button className="w-full" type="submit" isLoading={authStatus === "loading"}>
            Enter dashboard
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-[var(--primary)]">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
