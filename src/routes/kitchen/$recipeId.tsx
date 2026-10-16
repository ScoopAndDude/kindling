import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { recipeById } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { BackLink, Button, Photo } from "@/components/ui";

export const Route = createFileRoute("/kitchen/$recipeId")({
  component: RecipePage,
});

function RecipePage() {
  const { recipeId } = Route.useParams();
  const recipe = recipeById(recipeId);
  const saved = useCamp((state) => state.savedRecipes.includes(recipeId));
  const toggle = useCamp((state) => state.toggleRecipe);

  if (!recipe) {
    return (
      <div>
        <BackLink to="/kitchen" label="Kitchen" />
        <h1 className="font-display text-4xl text-ink">That recipe is not in the kit.</h1>
      </div>
    );
  }

  return (
    <div>
      <BackLink to="/kitchen" label="Kitchen" />
      <div className="overflow-hidden rounded-3xl">
        <div className="aspect-food md:aspect-hero">
          <Photo src={recipe.image} alt={recipe.imageAlt} priority />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-pine">{recipe.fire}</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-ink md:text-5xl">{recipe.name}</h1>
          <p className="mt-3 text-muted">
            {recipe.minutes} minutes · serves {recipe.serves}
          </p>
        </div>
        <Button variant={saved ? "pine" : "ghost"} className={cn(!saved && "shadow-card")} aria-pressed={saved} onClick={() => toggle(recipe.id)}>
          <Heart className={cn("size-4", saved && "fill-cream")} aria-hidden="true" />
          {saved ? "Saved" : "Save recipe"}
        </Button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section>
          <h2 className="font-display text-3xl text-ink">Ingredients</h2>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((item) => (
              <li key={item} className="border-b border-ink/10 py-2 text-ink">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="lg:col-span-2">
          <h2 className="font-display text-3xl text-ink">Method</h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pine text-sm text-cream tabular-nums">
                  {index + 1}
                </span>
                <p className="pt-1 text-ink">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
