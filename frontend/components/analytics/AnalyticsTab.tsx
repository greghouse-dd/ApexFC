"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import OverviewTab from "./overview/OverviewTab";
import AttackingTab from "./attacking/AttackingTab";
import PassingTab from "./passing/PassingTab";
import DefendingTab from "./defending/DefendingTab";
import PhysicalTab from "./physical/PhysicalTab";
import GoalkeepingTab from "./goalkeeping/GoalkeepingTab";
import ComparisonTab from "./comparision/ComparisionTab";

export default function AnalyticsTabs() {
  return (
    <Tabs defaultValue="overview">

      <TabsList>

        <TabsTrigger value="overview">Overview</TabsTrigger>

        <TabsTrigger value="attack">Attack</TabsTrigger>

        <TabsTrigger value="passing">Passing</TabsTrigger>

        <TabsTrigger value="defense">Defense</TabsTrigger>

        <TabsTrigger value="physical">Physical</TabsTrigger>

        <TabsTrigger value="goalkeeping">Goalkeeping</TabsTrigger>

        <TabsTrigger value="comparison">
          Head-to-Head
        </TabsTrigger>

      </TabsList>

      <TabsContent value="overview">
        <OverviewTab />
      </TabsContent>

      <TabsContent value="attack">
        <AttackingTab />
      </TabsContent>

      <TabsContent value="passing">
        <PassingTab />
      </TabsContent>

      <TabsContent value="defense">
        <DefendingTab />
      </TabsContent>

      <TabsContent value="physical">
        <PhysicalTab />
      </TabsContent>

      <TabsContent value="goalkeeping">
        <GoalkeepingTab />
      </TabsContent>

      <TabsContent value="comparison">
        <ComparisonTab />
      </TabsContent>

    </Tabs>
  );
}