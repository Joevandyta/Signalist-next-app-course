"use client";
import FooterLink from "@/components/form/FooterLink";
import InputField from "@/components/form/InputField";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

const SignIn = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });
  const onSubmit = async (data: SignInFormData) => {
    try {
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <h1 className="form-title"> Log In Your Account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name={"email"}
          label={"Email"}
          placeholder={"jovan@zhou.com"}
          register={register}
          error={errors.email}
          validation={{
            required: "Email is Required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Email must be a valid email address",
            },
            minLength: {
              value: 2,
              message: "Email must be at least 2 characters long",
            },
          }}
          className="w-full"
        />
        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          register={register}
          type="password"
          error={errors.password}
          validation={{
            required: "Password is Required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long",
            },
          }}
          className="w-full"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </Button>
        <FooterLink
          text="Don't have an account?"
          linkText="Sign Up"
          href="/sign-up"
        />
      </form>
    </>
  );
};

export default SignIn;
