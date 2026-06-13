import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import Button from "../components/ui/Button";
import InputField from "../components/ui/InputField";
import SelectField from "../components/ui/SelectField";
import { registerUser } from "../features/auth/authSlice";
import type { RegisterFormValues } from "../types/auth";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "sales"]),
});

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "sales",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await dispatch(registerUser(values)).unwrap();
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(String(error));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="glass-card w-full p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Xeno CRM</p>
        <h1 className="mt-2 text-3xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Register as an Admin or Sales user to test the role-based flow.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField label="Full Name" placeholder="Your name" error={errors.fullName?.message} {...register("fullName")} />
          <InputField label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <InputField
            label="Password"
            type="password"
            placeholder="Create password"
            error={errors.password?.message}
            {...register("password")}
          />
          <SelectField
            label="Role"
            error={errors.role?.message}
            options={[
              { value: "sales", label: "Sales User" },
              { value: "admin", label: "Admin" },
            ]}
            {...register("role")}
          />
          <Button className="w-full" type="submit" isLoading={authStatus === "loading"}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--primary)]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
