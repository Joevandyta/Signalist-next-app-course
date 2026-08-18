"use client";

import { CountrySelectField } from "@/components/form/CountrySelectField";
import FooterLink from "@/components/form/FooterLink";
import InputField from "@/components/form/InputField";
import SelectField from "@/components/form/SelectField";
import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "US",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });
  const onSubmit = async (data: SignUpFormData) => {
    try {
      //signUp with Email
      const result = await signUpWithEmail(data);
      if (result.success) {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error("Sign-up failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to create an account",
      });
    }
  };

  return (
    <>
      <h1 className="form-title"> Sign Up & Personalize</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* INPUT */}
        <InputField
          name="fullName"
          label="Full Name"
          placeholder="Jovan"
          register={register}
          error={errors.fullName}
          validation={{
            required: "Full name is Required",
            minLength: {
              value: 2,
              message: "Email must be at least 2 characters long",
            },
          }}
        />

        <InputField
          name="email"
          label="Email"
          placeholder="Jovan@zhou.com"
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
        />

        {/* Country */}
        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        {/* Investment */}

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goals"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required={true}
        />
        <SelectField
          name="riskTolerance"
          label="Risk tolerance"
          placeholder="Select your investment goals"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required={true}
        />
        <SelectField
          name="preferredIndustry"
          label="Preferred industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Creating account..." : "Start Investing Now"}
        </Button>
        <FooterLink
          text="Already have an account?"
          linkText="Sign In"
          href="/sign-in"
        />
      </form>
    </>
  );
};

export default SignUp;
