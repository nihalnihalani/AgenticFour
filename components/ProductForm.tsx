"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, DollarSign, FileText, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-borders-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductDataSchema, type ProductData } from "@/lib/types";

interface ProductFormProps {
  onSubmit: (productData: ProductData) => void;
  isLoading?: boolean;
}

export default function ProductForm({ onSubmit, isLoading = false }: ProductFormProps) {
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductData>({
    resolver: zodResolver(ProductDataSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      features: [],
      imageUrl: '',
    },
  });

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      const newFeatures = [...features, featureInput.trim()];
      setFeatures(newFeatures);
      setValue("features", newFeatures);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    setValue("features", newFeatures);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProductImagePreview(result);
        setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };


  const onFormSubmit = (data: ProductData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Product Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Product Name
        </Label>
        <Input
          id="title"
          placeholder="E.g. Smartphone Galaxy Ultra"
          {...register("title")}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the product in detail..."
          rows={4}
          {...register("description")}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price
        </Label>
        <Input
          id="price"
          placeholder="E.g. $999.99 USD"
          {...register("price")}
          disabled={isLoading}
        />
        {errors.price && (
          <p className="text-sm text-red-400">{errors.price.message}</p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Product Features
        </Label>
        <div className="flex gap-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            placeholder="Add a feature"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={handleAddFeature}
            disabled={isLoading}
            variant="outline"
          >
            Add
          </Button>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
              >
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="text-gray-400 hover:text-red-400"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Image */}
      <div className="space-y-2">
        <Label htmlFor="productImage" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Product Image
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="productImage"
            type="file"
            accept="image/*"
            onChange={handleProductImageChange}
            disabled={isLoading}
            className="flex-1"
          />
          {productImagePreview && (
            <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
              <img
                src={productImagePreview}
                alt="Product preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
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
          "Generate Ad"
        )}
      </RainbowButton>
    </form>
  );
}