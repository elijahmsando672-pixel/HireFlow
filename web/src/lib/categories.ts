export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "development-it",
    name: "Development & IT",
    subcategories: [
      "Web Development",
      "Mobile Development",
      "Software Development",
      "Data & AI",
      "Cybersecurity",
      "IT & Networking",
      "Cloud & DevOps",
      "Database & Data Engineering",
      "Game Development",
      "Blockchain & Web3"
    ]
  },
  {
    id: "design-creative",
    name: "Design & Creative",
    subcategories: [
      "UI/UX Design",
      "Graphic Design",
      "Video & Animation",
      "Photography",
      "3D Design",
      "Music & Audio"
    ]
  },
  {
    id: "writing-languages",
    name: "Writing & Languages",
    subcategories: [
      "Writing",
      "Copywriting",
      "Editing & Proofreading",
      "Translation",
      "Transcription"
    ]
  },
  {
    id: "marketing-sales",
    name: "Marketing & Sales",
    subcategories: [
      "Digital Marketing",
      "SEO",
      "Social Media",
      "Sales",
      "Lead Generation"
    ]
  },
  {
    id: "business",
    name: "Business",
    subcategories: [
      "Consulting",
      "Finance & Accounting",
      "HR & Recruiting",
      "Legal",
      "Business Administration"
    ]
  },
  {
    id: "admin-support",
    name: "Admin & Support",
    subcategories: [
      "Virtual Assistance",
      "Data Entry",
      "Customer Service",
      "Technical Support"
    ]
  },
  {
    id: "engineering-professional",
    name: "Engineering & Professional",
    subcategories: [
      "Civil Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Architecture",
      "Education & Tutoring"
    ]
  }
];

export function getAllSubcategories(): string[] {
  return CATEGORIES.flatMap((cat) => cat.subcategories);
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

export function getSubcategoriesByCategoryId(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category ? category.subcategories : [];
}

export function formatCategoryDisplay(subcategory: string): string {
  return subcategory;
}

export function parseCategoryDisplay(display: string): { categoryId: string; subcategory: string } | null {
  for (const category of CATEGORIES) {
    if (category.subcategories.includes(display)) {
      return { categoryId: category.id, subcategory: display };
    }
  }
  return null;
}

export function getCategoryIdFromSubcategory(subcategory: string): string | null {
  for (const category of CATEGORIES) {
    if (category.subcategories.includes(subcategory)) {
      return category.id;
    }
  }
  return null;
}
