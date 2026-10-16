import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { RECIPES } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { PageIntro, Photo } from "@/components/ui";

export const Route = createFileRoute("/kitchen/")({
  component: KitchenPage,
});

function KitchenPage() {
  const saved = useCamp((state) => state.savedRecipes);
  const toggle = useCamp((state) => state.toggleRecipe);

  return (
    <div>
      <PageIntro kicker="Camp kitchen" title="Cooked over coals">
        Four fireside meals. Save the ones you want on the next list.
      </PageIntro>
      <div className="grid gap-4 sm:grid-cols-2">
        {RECIPES.map((recipe) => {
          const marked = saved.includes(recipe.id);
          return (
            <article key={recipe.id} className="relative overflow-hidden rounded-2xl bg-cream shadow-card">
              <button
                type="button"
                aria-pressed={marked}
                aria-label={marked ? `Unsave ${recipe.name}` : `Save ${recipe.name}`}
                onClick={() => toggle(recipe.id)}
                className={cn(
                  "absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full",
                  marked ? "bg-cream text-ember" : "bg-ink/45 text-cream",
                )}
              >
                <Heart className={cn("size-5", marked && "fill-ember")} aria-hidden="true" />
              </button>
              <Link to="/kitchen/$recipeId" params={{ recipeId: recipe.id }} className="block">
                <div className="aspect-food overflow-hidden">
                  <Photo src={recipe.image} alt={recipe.imageAlt} />
                </div>
                <div className="p-4">
                  <h2 className="font-display text-2xl text-ink">{recipe.name}</h2>
                  <p className="mt-1 text-sm text-muted">{recipe.blurb}</p>
                  <p className="mt-3 text-sm text-ink">
                    {recipe.minutes} min · serves {recipe.serves}
                  </p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
