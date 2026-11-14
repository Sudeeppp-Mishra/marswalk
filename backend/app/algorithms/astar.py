import heapq
import math
import numpy as np
from typing import List, Tuple, Dict, Any, Optional

class AStarPlanner:
    def __init__(
        self,
        elevation_grid: np.ndarray,
        slope_grid: np.ndarray,
        res_meters: float = 20.0,
        max_slope_deg: float = 20.0,
        climb_weight: float = 2.0
    ):
        """
        A* pathfinder operating on Mars DEM and slope grids.
        :param elevation_grid: 2D array of elevations in meters
        :param slope_grid: 2D array of slopes in degrees
        :param res_meters: Grid resolution in meters per pixel (default 20.0m)
        :param max_slope_deg: Threshold above which terrain is impassable
        :param climb_weight: Penalty weight for uphill elevation gain
        """
        self.elevation = elevation_grid
        self.slope = slope_grid
        self.res = res_meters
        self.max_slope = max_slope_deg
        self.climb_weight = climb_weight
        self.height, self.width = elevation_grid.shape

        # 8-connected neighbor movements: (d_row, d_col, base_distance_meters)
        diag = res_meters * math.sqrt(2.0)
        self.neighbors = [
            (-1, 0, res_meters),  # N
            (1, 0, res_meters),   # S
            (0, -1, res_meters),  # W
            (0, 1, res_meters),   # E
            (-1, -1, diag),       # NW
            (-1, 1, diag),        # NE
            (1, -1, diag),        # SW
            (1, 1, diag),         # SE
        ]

    def _is_valid(self, r: int, c: int) -> bool:
        if 0 <= r < self.height and 0 <= c < self.width:
            slope_val = self.slope[r, c]
            elev_val = self.elevation[r, c]
            if np.isnan(slope_val) or np.isnan(elev_val):
                return False
            return slope_val <= self.max_slope
        return False

    def find_path(
        self,
        start_rc: Tuple[int, int],
        dest_rc: Tuple[int, int]
    ) -> Optional[Dict[str, Any]]:
        """
        Executes A* search between start_rc (row, col) and dest_rc (row, col).
        Returns route coordinates, distance, elevation profile, and metrics.
        """
        start_r, start_c = start_rc
        dest_r, dest_c = dest_rc

        if not self._is_valid(start_r, start_c):
            return {"error": "Starting point is in impassable terrain (slope exceeds threshold or NoData)."}
        if not self._is_valid(dest_r, dest_c):
            return {"error": "Destination point is in impassable terrain (slope exceeds threshold or NoData)."}

        # Priority queue stores tuples: (f_score, g_score, (r, c))
        open_set = []
        heapq.heappush(open_set, (0.0, 0.0, (start_r, start_c)))

        came_from = {}
        g_scores = {(start_r, start_c): 0.0}

        # Metric Euclidean distance heuristic
        def heuristic(r1, c1, r2, c2):
            return math.hypot((r1 - r2) * self.res, (c1 - c2) * self.res)

        iterations = 0
        max_iterations = 250000  # Protection against infinite loops

        while open_set and iterations < max_iterations:
            iterations += 1
            _, current_g, current = heapq.heappop(open_set)

            if current == (dest_r, dest_c):
                # Reconstruct path
                path = []
                curr = current
                while curr in came_from:
                    path.append(curr)
                    curr = came_from[curr]
                path.append((start_r, start_c))
                path.reverse()

                return self._compile_route_stats(path)

            if current_g > g_scores.get(current, float('inf')):
                continue

            curr_r, curr_c = current
            curr_elev = self.elevation[curr_r, curr_c]

            for dr, dc, dist_step in self.neighbors:
                nr, nc = curr_r + dr, curr_c + dc

                if not self._is_valid(nr, nc):
                    continue

                neighbor = (nr, nc)
                next_elev = self.elevation[nr, nc]
                next_slope = self.slope[nr, nc]

                # Terrain traversal cost formula
                # Base step cost + slope penalty + uphill climb penalty
                if next_slope <= 10.0:
                    slope_penalty = 0.05 * next_slope
                else:
                    # Steep nonlinear penalty for slopes between 10 deg and max_slope
                    slope_penalty = 0.5 + 0.15 * (next_slope - 10.0)**2

                elev_diff = next_elev - curr_elev
                uphill_penalty = max(0.0, elev_diff) * self.climb_weight

                step_cost = dist_step * (1.0 + slope_penalty) + uphill_penalty
                tentative_g = current_g + step_cost

                if tentative_g < g_scores.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_scores[neighbor] = tentative_g
                    f_score = tentative_g + heuristic(nr, nc, dest_r, dest_c)
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor))

        return {"error": "No viable path found avoiding slopes > 20° within search limit."}

    def _compile_route_stats(self, path: List[Tuple[int, int]]) -> Dict[str, Any]:
        """Calculates distance, cumulative elevation gain/loss, and slope distribution."""
        total_dist = 0.0
        elevations = []
        slopes = []
        elevation_gain = 0.0
        elevation_loss = 0.0

        for i in range(len(path)):
            r, c = path[i]
            elev = float(self.elevation[r, c])
            slope = float(self.slope[r, c])
            elevations.append(elev)
            slopes.append(slope)

            if i > 0:
                pr, pc = path[i - 1]
                dr = abs(r - pr)
                dc = abs(c - pc)
                if dr + dc == 2:
                    dist = self.res * math.sqrt(2.0)
                else:
                    dist = self.res
                total_dist += dist

                de = elev - elevations[i - 1]
                if de > 0:
                    elevation_gain += de
                else:
                    elevation_loss += abs(de)

        max_slope_val = max(slopes) if slopes else 0.0
        mean_slope_val = sum(slopes) / len(slopes) if slopes else 0.0

        # Assess route difficulty
        if max_slope_val > 15.0 or elevation_gain > 300.0:
            difficulty = "Challenging"
        elif max_slope_val > 8.0 or elevation_gain > 100.0:
            difficulty = "Moderate"
        else:
            difficulty = "Nominal / Low Risk"

        return {
            "path_rc": path,
            "waypoints_count": len(path),
            "distance_meters": round(total_dist, 1),
            "distance_km": round(total_dist / 1000.0, 2),
            "elevation_gain_m": round(elevation_gain, 1),
            "elevation_loss_m": round(elevation_loss, 1),
            "min_elevation_m": round(min(elevations), 1),
            "max_elevation_m": round(max(elevations), 1),
            "mean_slope_deg": round(mean_slope_val, 1),
            "max_slope_deg": round(max_slope_val, 1),
            "estimated_difficulty": difficulty,
            "assumptions": [
                f"Maximum slope threshold: {self.max_slope}° (slopes > {self.max_slope}° considered impassable)",
                "Elevation gain penalty factor: 2.0x metric resistance",
                "Assumes 20m CTX DTM resolution: micro-hazards (<20m boulders, loose sand) not detected in orbital data",
                "Suggested trajectory: not certified for crew safety"
            ]
        }

