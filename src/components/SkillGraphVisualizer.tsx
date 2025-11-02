import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Network } from "lucide-react";
import * as d3 from "d3";

interface SkillNode {
  id: string;
  group: number;
}

interface SkillLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export const SkillGraphVisualizer = ({ studentSkills }: { studentSkills?: string[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: SkillNode[]; links: SkillLink[] } | null>(null);

  const fetchSkillGraph = async () => {
    setIsLoading(true);
    try {
      const { data: relationships, error } = await supabase
        .from('skill_relationships' as any)
        .select('*')
        .order('weight', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Build nodes and links for D3
      const nodeMap = new Map<string, SkillNode>();
      const links: SkillLink[] = [];

      relationships?.forEach((rel: any) => {
        if (!nodeMap.has(rel.skill_from)) {
          nodeMap.set(rel.skill_from, {
            id: rel.skill_from,
            group: studentSkills?.includes(rel.skill_from) ? 1 : 2
          });
        }
        if (!nodeMap.has(rel.skill_to)) {
          nodeMap.set(rel.skill_to, {
            id: rel.skill_to,
            group: studentSkills?.includes(rel.skill_to) ? 1 : 3
          });
        }

        links.push({
          source: rel.skill_from,
          target: rel.skill_to,
          type: rel.relationship_type,
          weight: rel.weight
        });
      });

      setGraphData({
        nodes: Array.from(nodeMap.values()),
        links
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (graphData && svgRef.current) {
      renderGraph();
    }
  }, [graphData]);

  const renderGraph = () => {
    if (!svgRef.current || !graphData) return;

    const width = 800;
    const height = 600;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.weight * 2));

    // Add nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d) => {
        if (d.group === 1) return "#10b981"; // Student's skills (green)
        if (d.group === 2) return "#3b82f6"; // Related skills (blue)
        return "#f59e0b"; // Suggested skills (orange)
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Add labels
    const label = svg.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .join("text")
      .text((d) => d.id)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Skill Relationship Graph (GNN)
            </CardTitle>
            <CardDescription>
              Visual representation of skill connections and learning paths
            </CardDescription>
          </div>
          <Button onClick={fetchSkillGraph} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load Graph
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {graphData ? (
          <div className="border rounded-lg bg-muted/10 overflow-auto">
            <svg ref={svgRef}></svg>
            <div className="p-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Your Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Related Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Suggested Skills</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click "Load Graph" to visualize skill relationships
          </div>
        )}
      </CardContent>
    </Card>
  );
};
