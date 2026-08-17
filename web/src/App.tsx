import { Routes, Route } from "react-router-dom";
import { Protected, ProtectedCentered } from "./components/Protected";
import { PublicLayout } from "./components/PublicLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import AddBio from "./pages/AddBio";
import Interview from "./pages/Interview";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import PostJob from "./pages/PostJob";
import MyJobs from "./pages/MyJobs";
import JobProposals from "./pages/JobProposals";
import MyProposals from "./pages/MyProposals";
import Gigs from "./pages/Gigs";
import GigDetails from "./pages/GigDetails";
import CreateGig from "./pages/CreateGig";
import MyGigs from "./pages/MyGigs";
import MyOrders from "./pages/MyOrders";
import Contracts from "./pages/Contracts";
import ContractDetails from "./pages/ContractDetails";
import Messages from "./pages/Messages";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Upgrade from "./pages/Upgrade";

export default function App() {
  return (
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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
