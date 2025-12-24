import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import AnnotatorDashboard from "@/pages/AnnotatorDashboard";
import AnnotationInterface from "@/pages/AnnotationInterface";
import SpecialistDashboard from "@/pages/SpecialistDashboard";
import ProjectDetails from "@/pages/ProjectDetails";
import ImagePortfolio from "@/pages/ImagePortfolio";
import CreateAccount from "@/pages/CreateAccount";
import AssignRole from "@/pages/AssignRole";
import ImageDetails from "@/pages/ImageDetails";
import ResetPassword from "@/pages/ResetPassword";
import UserProfile from "@/pages/UserProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/annotator/dashboard" component={AnnotatorDashboard} />
      <Route path="/annotator/annotate/:id" component={AnnotationInterface} />
      <Route path="/specialist/dashboard" component={SpecialistDashboard} />
      <Route path="/specialist/portfolio" component={ImagePortfolio} />
      <Route path="/specialist/projects/:id" component={ProjectDetails} />
      <Route path="/specialist/images/:id" component={ImageDetails} />
      <Route path="/admin/create-account" component={CreateAccount} />
      <Route path="/admin/assign-role" component={AssignRole} />
      <Route path="/admin/dashboard" component={() => <Redirect to="/admin/assign-role" />} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/profile" component={UserProfile} />
      <Route component={NotFound} />

    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

