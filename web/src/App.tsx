import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Protected, ProtectedCentered } from "./components/Protected";
import { PublicLayout } from "./components/PublicLayout";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AddBio = lazy(() => import("./pages/AddBio"));
const Interview = lazy(() => import("./pages/Interview"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetails = lazy(() => import("./pages/JobDetails"));
const PostJob = lazy(() => import("./pages/PostJob"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const JobProposals = lazy(() => import("./pages/JobProposals"));
const MyProposals = lazy(() => import("./pages/MyProposals"));
const Gigs = lazy(() => import("./pages/Gigs"));
const GigDetails = lazy(() => import("./pages/GigDetails"));
const CreateGig = lazy(() => import("./pages/CreateGig"));
const MyGigs = lazy(() => import("./pages/MyGigs"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ContractDetails = lazy(() => import("./pages/ContractDetails"));
const Messages = lazy(() => import("./pages/Messages"));
const Saved = lazy(() => import("./pages/Saved"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Verify = lazy(() => import("./pages/Verify"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<PublicLayout />}>
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/upgrade" element={<Upgrade />} />
        </Route>

        <Route element={<ProtectedCentered />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/add-bio" element={<AddBio />} />
          <Route path="/interview" element={<Interview />} />
        </Route>

        <Route element={<Protected />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/jobs/:id/proposals" element={<JobProposals />} />
          <Route path="/my-proposals" element={<MyProposals />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/gigs/:id" element={<GigDetails />} />
          <Route path="/create-gig" element={<CreateGig />} />
          <Route path="/my-gigs" element={<MyGigs />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/users/:id" element={<Profile />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
