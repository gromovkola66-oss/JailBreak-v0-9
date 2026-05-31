using UnityEngine;
using UnityEditor;

public class JailBreakMapBuilder : EditorWindow
{
    [MenuItem("JailBreak/Build Prison Map (Step 2)")]
    public static void BuildPrisonMap()
    {
        // Clean up existing map
        GameObject existingMap = GameObject.Find("PrisonMap");
        if (existingMap != null) DestroyImmediate(existingMap);

        // Remove old floor and boxes from Step 1
        DestroyIfExists("Floor");
        DestroyIfExists("Box_Red");
        DestroyIfExists("Box_Blue");
        DestroyIfExists("Box_Green");
        DestroyIfExists("Box_Yellow");

        // Parent object for entire map
        GameObject map = new GameObject("PrisonMap");
        map.transform.position = Vector3.zero;

        // === MATERIALS ===
        Material wallMat = CreateMat(new Color(0.85f, 0.82f, 0.75f));       // Warm beige walls
        Material floorMat = CreateMat(new Color(0.55f, 0.55f, 0.6f));       // Gray floor
        Material ceilingMat = CreateMat(new Color(0.9f, 0.9f, 0.85f));      // Light ceiling
        Material cellWallMat = CreateMat(new Color(0.75f, 0.78f, 0.82f));   // Bluish cell walls
        Material doorFrameMat = CreateMat(new Color(0.3f, 0.3f, 0.35f));    // Dark metal frames
        Material barsMat = CreateMat(new Color(0.25f, 0.25f, 0.3f));        // Dark bars
        Material yardFloorMat = CreateMat(new Color(0.4f, 0.6f, 0.35f));    // Green yard
        Material yardWallMat = CreateMat(new Color(0.7f, 0.5f, 0.3f));      // Orange/brown yard walls
        Material guardRoomMat = CreateMat(new Color(0.3f, 0.4f, 0.6f));     // Blue guard room
        Material bedMat = CreateMat(new Color(0.6f, 0.4f, 0.2f));           // Brown bed
        Material mattressMat = CreateMat(new Color(0.4f, 0.5f, 0.7f));      // Blue mattress
        Material toiletMat = CreateMat(new Color(0.9f, 0.9f, 0.95f));       // White toilet
        Material tableMat = CreateMat(new Color(0.5f, 0.35f, 0.2f));        // Brown table
        Material benchMat = CreateMat(new Color(0.6f, 0.45f, 0.25f));       // Light brown bench
        Material roofMat = CreateMat(new Color(0.4f, 0.35f, 0.3f));         // Dark roof

        // === DIMENSIONS ===
        float corridorLength = 36f;
        float corridorWidth = 4f;
        float wallHeight = 4f;
        float wallThickness = 0.4f;
        float cellWidth = 5f;
        float cellDepth = 4f;
        int cellsPerSide = 3;

        // === MAIN CORRIDOR ===
        // Floor
        CreateBox("Corridor_Floor", map, new Vector3(0, 0, 0), new Vector3(corridorWidth, 0.2f, corridorLength), floorMat);

        // Ceiling
        CreateBox("Corridor_Ceiling", map, new Vector3(0, wallHeight, 0), new Vector3(corridorWidth + wallThickness * 2, 0.3f, corridorLength), ceilingMat);

        // Left wall (solid parts between cell openings)
        // Right wall (solid parts between cell openings)
        float cellSpacing = corridorLength / cellsPerSide;

        // Back wall
        CreateBox("Corridor_BackWall", map, new Vector3(0, wallHeight / 2, -corridorLength / 2), new Vector3(corridorWidth + wallThickness * 2 + cellDepth * 2 + 2f, wallHeight, wallThickness), wallMat);

        // === CELLS - LEFT SIDE ===
        for (int i = 0; i < cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i + cellSpacing / 2;
            BuildCell("CellL" + (i + 1), map, new Vector3(-corridorWidth / 2 - cellDepth / 2, 0, zPos), cellWidth, cellDepth, wallHeight, wallThickness, cellWallMat, floorMat, ceilingMat, barsMat, doorFrameMat, bedMat, mattressMat, toiletMat, true);
        }

        // === CELLS - RIGHT SIDE ===
        for (int i = 0; i < cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i + cellSpacing / 2;
            BuildCell("CellR" + (i + 1), map, new Vector3(corridorWidth / 2 + cellDepth / 2, 0, zPos), cellWidth, cellDepth, wallHeight, wallThickness, cellWallMat, floorMat, ceilingMat, barsMat, doorFrameMat, bedMat, mattressMat, toiletMat, false);
        }

        // Corridor walls between cells (left side)
        for (int i = 0; i <= cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i;
            CreateBox("WallL_Div" + i, map, new Vector3(-corridorWidth / 2 - cellDepth / 2, wallHeight / 2, zPos), new Vector3(cellDepth, wallHeight, wallThickness), cellWallMat);
        }

        // Corridor walls between cells (right side)
        for (int i = 0; i <= cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i;
            CreateBox("WallR_Div" + i, map, new Vector3(corridorWidth / 2 + cellDepth / 2, wallHeight / 2, zPos), new Vector3(cellDepth, wallHeight, wallThickness), cellWallMat);
        }

        // Outer walls of cells
        CreateBox("OuterWall_Left", map, new Vector3(-corridorWidth / 2 - cellDepth - wallThickness / 2, wallHeight / 2, 0), new Vector3(wallThickness, wallHeight, corridorLength), wallMat);
        CreateBox("OuterWall_Right", map, new Vector3(corridorWidth / 2 + cellDepth + wallThickness / 2, wallHeight / 2, 0), new Vector3(wallThickness, wallHeight, corridorLength), wallMat);

        // === YARD (at the end of corridor) ===
        float yardSize = 16f;
        float yardZ = corridorLength / 2 + yardSize / 2;

        // Yard floor
        CreateBox("Yard_Floor", map, new Vector3(0, 0, yardZ), new Vector3(yardSize, 0.2f, yardSize), yardFloorMat);

        // Yard walls
        CreateBox("Yard_WallLeft", map, new Vector3(-yardSize / 2, wallHeight / 2, yardZ), new Vector3(wallThickness, wallHeight, yardSize), yardWallMat);
        CreateBox("Yard_WallRight", map, new Vector3(yardSize / 2, wallHeight / 2, yardZ), new Vector3(wallThickness, wallHeight, yardSize), yardWallMat);
        CreateBox("Yard_WallBack", map, new Vector3(0, wallHeight / 2, yardZ + yardSize / 2), new Vector3(yardSize, wallHeight, wallThickness), yardWallMat);

        // Yard front wall with opening
        CreateBox("Yard_FrontL", map, new Vector3(-yardSize / 4 - 1f, wallHeight / 2, yardZ - yardSize / 2), new Vector3(yardSize / 2 - 2f, wallHeight, wallThickness), yardWallMat);
        CreateBox("Yard_FrontR", map, new Vector3(yardSize / 4 + 1f, wallHeight / 2, yardZ - yardSize / 2), new Vector3(yardSize / 2 - 2f, wallHeight, wallThickness), yardWallMat);

        // Yard benches
        CreateBox("Yard_Bench1", map, new Vector3(-4f, 0.4f, yardZ + 3f), new Vector3(3f, 0.3f, 0.8f), benchMat);
        CreateBox("Yard_Bench2", map, new Vector3(4f, 0.4f, yardZ - 3f), new Vector3(3f, 0.3f, 0.8f), benchMat);

        // Yard table
        CreateBox("Yard_Table", map, new Vector3(0, 0.7f, yardZ + 5f), new Vector3(2f, 0.15f, 1.5f), tableMat);
        CreateBox("Yard_TableLeg1", map, new Vector3(-0.7f, 0.35f, yardZ + 5.5f), new Vector3(0.15f, 0.7f, 0.15f), tableMat);
        CreateBox("Yard_TableLeg2", map, new Vector3(0.7f, 0.35f, yardZ + 5.5f), new Vector3(0.15f, 0.7f, 0.15f), tableMat);
        CreateBox("Yard_TableLeg3", map, new Vector3(-0.7f, 0.35f, yardZ + 4.5f), new Vector3(0.15f, 0.7f, 0.15f), tableMat);
        CreateBox("Yard_TableLeg4", map, new Vector3(0.7f, 0.35f, yardZ + 4.5f), new Vector3(0.15f, 0.7f, 0.15f), tableMat);

        // === GUARD ROOM (side room near entrance) ===
        float guardX = -corridorWidth / 2 - cellDepth - 6f;
        float guardZ = -corridorLength / 2 + 6f;
        float guardW = 5f;
        float guardD = 5f;

        CreateBox("Guard_Floor", map, new Vector3(guardX, 0, guardZ), new Vector3(guardW, 0.2f, guardD), floorMat);
        CreateBox("Guard_Ceiling", map, new Vector3(guardX, wallHeight, guardZ), new Vector3(guardW, 0.3f, guardD), ceilingMat);
        CreateBox("Guard_WallBack", map, new Vector3(guardX, wallHeight / 2, guardZ - guardD / 2), new Vector3(guardW, wallHeight, wallThickness), guardRoomMat);
        CreateBox("Guard_WallFront", map, new Vector3(guardX, wallHeight / 2, guardZ + guardD / 2), new Vector3(guardW, wallHeight, wallThickness), guardRoomMat);
        CreateBox("Guard_WallLeft", map, new Vector3(guardX - guardW / 2, wallHeight / 2, guardZ), new Vector3(wallThickness, wallHeight, guardD), guardRoomMat);
        // Right wall has doorway (partial wall)
        CreateBox("Guard_WallRightTop", map, new Vector3(guardX + guardW / 2, wallHeight * 0.75f + 0.5f, guardZ), new Vector3(wallThickness, wallHeight * 0.5f, guardD), guardRoomMat);

        // Guard room desk
        CreateBox("Guard_Desk", map, new Vector3(guardX - 1f, 0.7f, guardZ - 1f), new Vector3(2.5f, 0.15f, 1.2f), tableMat);

        // === LIGHTING ===
        // Add some point lights for atmosphere
        CreateLight("Light_Corridor1", map, new Vector3(0, wallHeight - 0.5f, -8f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Corridor2", map, new Vector3(0, wallHeight - 0.5f, 4f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Corridor3", map, new Vector3(0, wallHeight - 0.5f, -20f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Yard", map, new Vector3(0, wallHeight + 2f, yardZ), new Color(1f, 1f, 0.9f), 20f);
        CreateLight("Light_Guard", map, new Vector3(guardX, wallHeight - 0.5f, guardZ), new Color(0.8f, 0.9f, 1f), 8f);

        // === MOVE PLAYER TO SPAWN ===
        GameObject player = GameObject.Find("Player");
        if (player != null)
        {
            player.transform.position = new Vector3(0f, 1f, -corridorLength / 2 + 2f);
        }

        // Done
        Debug.Log("[JailBreak] Step 2 complete! Prison map built. Press Play to explore.");

        EditorUtility.DisplayDialog(
            "JailBreak - Step 2 Complete",
            "Prison Map created!\n\n" +
            "Includes:\n" +
            "- 6 cells (3 per side)\n" +
            "- Main corridor\n" +
            "- Yard with benches\n" +
            "- Guard room\n\n" +
            "Press PLAY to explore!",
            "OK"
        );
    }

    // ===== CELL BUILDER =====
    private static void BuildCell(string name, GameObject parent, Vector3 center, float width, float depth, float height, float thickness, Material wallMat, Material floorMat, Material ceilMat, Material barsMat, Material frameMat, Material bedMat, Material mattressMat, Material toiletMat, bool isLeft)
    {
        GameObject cell = new GameObject(name);
        cell.transform.SetParent(parent.transform);
        cell.transform.localPosition = center;

        // Floor
        CreateBoxLocal("Floor", cell, new Vector3(0, 0, 0), new Vector3(depth, 0.2f, width), floorMat);

        // Ceiling
        CreateBoxLocal("Ceiling", cell, new Vector3(0, height, 0), new Vector3(depth, 0.2f, width), ceilMat);

        // Back wall
        float backX = isLeft ? -depth / 2 + thickness / 2 : depth / 2 - thickness / 2;
        CreateBoxLocal("BackWall", cell, new Vector3(backX, height / 2, 0), new Vector3(thickness, height, width), wallMat);

        // Bars (door side - facing corridor)
        float frontX = isLeft ? depth / 2 : -depth / 2;
        int barCount = 6;
        float barSpacing = width / (barCount + 1);
        for (int b = 0; b < barCount; b++)
        {
            float barZ = -width / 2 + barSpacing * (b + 1);
            GameObject bar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            bar.name = "Bar" + b;
            bar.transform.SetParent(cell.transform);
            bar.transform.localPosition = new Vector3(frontX, height / 2, barZ);
            bar.transform.localScale = new Vector3(0.08f, height / 2, 0.08f);
            bar.GetComponent<Renderer>().material = barsMat;
        }

        // Top bar frame
        CreateBoxLocal("TopFrame", cell, new Vector3(frontX, height - 0.1f, 0), new Vector3(0.15f, 0.2f, width), frameMat);
        // Bottom bar frame
        CreateBoxLocal("BottomFrame", cell, new Vector3(frontX, 0.1f, 0), new Vector3(0.15f, 0.2f, width), frameMat);

        // === FURNITURE ===
        // Bed
        float bedX = isLeft ? -depth / 4 : depth / 4;
        float bedZ = -width / 2 + 1f;
        CreateBoxLocal("BedFrame", cell, new Vector3(bedX, 0.3f, bedZ), new Vector3(1.8f, 0.15f, 0.9f), bedMat);
        CreateBoxLocal("Mattress", cell, new Vector3(bedX, 0.42f, bedZ), new Vector3(1.7f, 0.1f, 0.8f), mattressMat);
        // Bed legs
        CreateBoxLocal("BedLeg1", cell, new Vector3(bedX - 0.7f, 0.15f, bedZ - 0.35f), new Vector3(0.1f, 0.3f, 0.1f), bedMat);
        CreateBoxLocal("BedLeg2", cell, new Vector3(bedX + 0.7f, 0.15f, bedZ - 0.35f), new Vector3(0.1f, 0.3f, 0.1f), bedMat);
        CreateBoxLocal("BedLeg3", cell, new Vector3(bedX - 0.7f, 0.15f, bedZ + 0.35f), new Vector3(0.1f, 0.3f, 0.1f), bedMat);
        CreateBoxLocal("BedLeg4", cell, new Vector3(bedX + 0.7f, 0.15f, bedZ + 0.35f), new Vector3(0.1f, 0.3f, 0.1f), bedMat);

        // Toilet
        float toiletX = isLeft ? -depth / 4 : depth / 4;
        float toiletZ = width / 2 - 0.8f;
        CreateBoxLocal("ToiletBase", cell, new Vector3(toiletX, 0.25f, toiletZ), new Vector3(0.5f, 0.5f, 0.4f), toiletMat);
        CreateBoxLocal("ToiletTank", cell, new Vector3(toiletX + (isLeft ? -0.2f : 0.2f), 0.45f, toiletZ), new Vector3(0.2f, 0.4f, 0.35f), toiletMat);
    }

    // ===== HELPERS =====
    private static Material CreateMat(Color color)
    {
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = color;
        return mat;
    }

    private static void CreateBox(string name, GameObject parent, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.SetParent(parent.transform);
        box.transform.position = position;
        box.transform.localScale = scale;
        box.GetComponent<Renderer>().material = mat;
    }

    private static void CreateBoxLocal(string name, GameObject parent, Vector3 localPos, Vector3 scale, Material mat)
    {
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.SetParent(parent.transform);
        box.transform.localPosition = localPos;
        box.transform.localScale = scale;
        box.GetComponent<Renderer>().material = mat;
    }

    private static void CreateLight(string name, GameObject parent, Vector3 position, Color color, float range)
    {
        GameObject lightObj = new GameObject(name);
        lightObj.transform.SetParent(parent.transform);
        lightObj.transform.position = position;
        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = color;
        light.range = range;
        light.intensity = 2f;
        light.shadows = LightShadows.Soft;
    }

    private static void DestroyIfExists(string name)
    {
        GameObject obj = GameObject.Find(name);
        if (obj != null) DestroyImmediate(obj);
    }
}
