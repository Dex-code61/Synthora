"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageLayout } from "@/components/layout/page-layout";
import { useAuth } from "@/hooks/use-auth";
import { useRepositories } from "@/hooks/use-repositories";
import { GitBranch, FileText, Users, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { repositories, isLoading, error, refetch } =
    useRepositories(isAuthenticated);

  // Rediriger vers la page de connexion si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [isAuthenticated, authLoading, router]);

  // Afficher le loading pendant la vérification de l'auth ou le chargement des données
  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Ne pas afficher la page si non authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  // Afficher l'erreur si il y en a une
  if (error) {
    return (
      <PageLayout>
        <div className="px-4 sm:px-0 flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Erreur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Une erreur est survenue"}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos analyses de repositories Git
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Repositories
              </CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repositories.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commits
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repositories.reduce(
                  (sum, repo) => sum + repo._count.commits,
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fichiers Analysés
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repositories.reduce(
                  (sum, repo) => sum + repo._count.fileMetrics,
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Repositories Actifs
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repositories.filter((repo) => repo.lastAnalyzed).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              Gérez et analysez vos repositories Git
            </CardDescription>
          </CardHeader>
          <CardContent>
            {repositories.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Aucun repository pour le moment
                </h3>
                <p className="text-muted-foreground">
                  Ajoutez votre premier repository pour commencer l'analyse
                </p>
                <Button className="mt-4">Ajouter un Repository</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{repo.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {repo.path}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {repo._count.commits} commits •{" "}
                        {repo._count.fileMetrics} fichiers analysés
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Voir Timeline
                      </Button>
                      <Button size="sm">Analyser</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
