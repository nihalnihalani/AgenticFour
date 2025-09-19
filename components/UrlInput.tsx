"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Sparkles } from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-borders-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export default function UrlInput({ onSubmit, isLoading = false }: UrlInputProps) {

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });


  const onFormSubmit = (data: UrlFormData) => {
    onSubmit(data.url);
  };

  const handleExampleClick = () => {
    const exampleUrl = "https://www.amazon.com/dp/B0DYZ2LBYW/ref=sspa_dk_detail_0?psc=1&pd_rd_i=B0DYZ2LBYW&pd_rd_w=xsdhn&content-id=amzn1.sym.953c7d66-4120-4d22-a777-f19dbfa69309&pf_rd_p=953c7d66-4120-4d22-a777-f19dbfa69309&pf_rd_r=FVSJAQFMEQFXW5P02E2K&pd_rd_wg=5pib7&pd_rd_r=4f465555-d38b-4106-b41a-47f0f35d14c1&sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWwy";
    setValue("url", exampleUrl, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="url" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Product URL
          </Label>
          <button
            type="button"
            onClick={handleExampleClick}
            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Try with example URL
          </button>
        </div>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/product"
          {...register("url")}
          disabled={isLoading}
          className="h-12 input-transparent"
        />
        {errors.url && (
          <p className="text-sm text-red-400">{errors.url.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <RainbowButton
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Generating Ad...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Ad
          </div>
        )}
      </RainbowButton>

      {/* Info Text */}
      <div className="bg-gray-800/10 rounded-lg p-2">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Make sure the URL is from a specific product page
          for best results. Our AI will automatically extract all necessary information.
        </p>
      </div>
    </form>
  );
}