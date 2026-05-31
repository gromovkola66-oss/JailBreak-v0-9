using UnityEngine;
using UnityEditor;

public class JailBreakEditor
{
    [MenuItem("JailBreak/Build Full Game")]
    public static void BuildFullGame()
    {
        DestroyAllRoots();
        CreateLighting();
        CreateMap();
        CreatePlayer();
        CreateBots();
        CreateManagers();
        CreateUI();
        PostProcessingSetup.Setup();
        Debug.Log("JailBreak: Full game built successfully!");
    }

    private static void DestroyAllRoots()
    {
        GameObject[] allObjects = GameObject.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
        foreach (GameObject obj in allObjects)
        {
            if (obj != null && obj.transform.parent == null)
            {
                Object.DestroyImmediate(obj);
            }
        }
    }

    private static Material CreateMat(Color color)
    {
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = color;
        return mat;
    }

    private static GameObject CreateBox(string name, Vector3 pos, Vector3 scale, Color color, Transform parent = null)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.name = name;
        obj.transform.position = pos;
        obj.transform.localScale = scale;
        if (parent != null) obj.transform.SetParent(parent);
        obj.GetComponent<Renderer>().material = CreateMat(color);
        return obj;
    }

    private static GameObject CreateCylinder(string name, Vector3 pos, Vector3 scale, Color color, Transform parent = null)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        obj.name = name;
        obj.transform.position = pos;
        obj.transform.localScale = scale;
        if (parent != null) obj.transform.SetParent(parent);
        obj.GetComponent<Renderer>().material = CreateMat(color);
        return obj;
    }

    private static GameObject CreateSphere(string name, Vector3 pos, Vector3 scale, Color color, Transform parent = null)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        obj.name = name;
        obj.transform.position = pos;
        obj.transform.localScale = scale;
        if (parent != null) obj.transform.SetParent(parent);
        obj.GetComponent<Renderer>().material = CreateMat(color);
        return obj;
    }

    private static GameObject CreateLight(string name, Vector3 pos, Color color, float range, float intensity, Transform parent = null)
    {
        GameObject obj = new GameObject(name);
        obj.transform.position = pos;
        if (parent != null) obj.transform.SetParent(parent);
        Light light = obj.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = color;
        light.range = range;
        light.intensity = intensity;
        return obj;
    }

    private static void CreateLighting()
    {
        GameObject dirLight = new GameObject("DirectionalLight");
        dirLight.transform.position = new Vector3(0f, 20f, 20f);
        dirLight.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
        Light dl = dirLight.AddComponent<Light>();
        dl.type = LightType.Directional;
        dl.color = new Color(1f, 0.95f, 0.85f);
        dl.intensity = 1.2f;

        // Emergency red lights in corridors
        for (int i = 0; i < 4; i++)
        {
            float z = -15f + i * 10f;
            GameObject redLight = CreateLight("EmergencyLight_" + i, new Vector3(2f, 4.0f, z), new Color(1f, 0.1f, 0.1f), 4f, 0.8f);
            redLight.AddComponent<FlickerLight>();
        }

        // Watch tower spotlights
        Vector3[] towerPositions = new Vector3[] { new Vector3(9f, 8.5f, 43f), new Vector3(-9f, 8.5f, 43f) };
        for (int i = 0; i < towerPositions.Length; i++)
        {
            GameObject spotObj = new GameObject("TowerSpot_" + i);
            spotObj.transform.position = towerPositions[i];
            spotObj.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            Light spot = spotObj.AddComponent<Light>();
            spot.type = LightType.Spot;
            spot.color = new Color(1f, 0.95f, 0.8f);
            spot.range = 15f;
            spot.intensity = 2f;
            spot.spotAngle = 60f;
        }
    }

    private static void CreateMap()
    {
        GameObject mapRoot = new GameObject("Map");
        Transform map = mapRoot.transform;

        CreateFloorAndWalls(map);
        CreateCellBlock(map);
        CreateMainCorridor(map);
        CreateGuardRoom(map);
        CreateArmory(map);
        CreateYard(map);
        CreateVentilationShaft(map);
        CreateMedicRoom(map);
        CreateCafeteria(map);

        // Add dust particles in indoor areas
        GameObject dust1 = new GameObject("DustParticles_Corridor");
        dust1.transform.position = new Vector3(0f, 2f, 0f);
        dust1.transform.SetParent(map);
        DustParticles dp1 = dust1.AddComponent<DustParticles>();
        dp1.particleCount = 20;
        dp1.spawnRadius = 2f;

        GameObject dust2 = new GameObject("DustParticles_Cells");
        dust2.transform.position = new Vector3(5f, 2f, -10f);
        dust2.transform.SetParent(map);
        DustParticles dp2 = dust2.AddComponent<DustParticles>();
        dp2.particleCount = 20;
        dp2.spawnRadius = 2f;

        GameObject dust3 = new GameObject("DustParticles_GuardArea");
        dust3.transform.position = new Vector3(-12f, 2f, -12f);
        dust3.transform.SetParent(map);
        DustParticles dp3 = dust3.AddComponent<DustParticles>();
        dp3.particleCount = 20;
        dp3.spawnRadius = 2f;
    }

    private static void CreateFloorAndWalls(Transform parent)
    {
        Color floorColor = new Color(0.4f, 0.4f, 0.4f);
        Color wallColor = new Color(0.6f, 0.6f, 0.55f);

        CreateBox("MainFloor", new Vector3(0f, 0f, 0f), new Vector3(60f, 0.5f, 80f), floorColor, parent);
        CreateBox("Ceiling", new Vector3(0f, 5f, 0f), new Vector3(60f, 0.3f, 80f), wallColor, parent);

        CreateBox("WallNorth", new Vector3(0f, 2.5f, 40f), new Vector3(60f, 5f, 0.5f), wallColor, parent);
        CreateBox("WallSouth", new Vector3(0f, 2.5f, -20f), new Vector3(60f, 5f, 0.5f), wallColor, parent);
        CreateBox("WallEast", new Vector3(30f, 2.5f, 10f), new Vector3(0.5f, 5f, 80f), wallColor, parent);
        CreateBox("WallWest", new Vector3(-30f, 2.5f, 10f), new Vector3(0.5f, 5f, 80f), wallColor, parent);

        // Floor tile pattern - alternating 4x4 meter tiles
        Color tileLight = new Color(0.42f, 0.42f, 0.42f);
        Color tileDark = new Color(0.38f, 0.38f, 0.38f);
        for (int x = -7; x <= 7; x++)
        {
            for (int z = -4; z <= 9; z++)
            {
                Color tileColor = ((x + z) % 2 == 0) ? tileLight : tileDark;
                GameObject tile = CreateBox("FloorTile_" + (x + 7) + "_" + (z + 4),
                    new Vector3(x * 4f, 0.26f, z * 4f),
                    new Vector3(4f, 0.05f, 4f), tileColor, parent);
                Object.DestroyImmediate(tile.GetComponent<Collider>());
            }
        }

        // Baseboards along walls
        Color baseboardColor = new Color(0.2f, 0.2f, 0.2f);
        CreateBox("Baseboard_North", new Vector3(0f, 0.35f, 39.7f), new Vector3(60f, 0.2f, 0.15f), baseboardColor, parent);
        CreateBox("Baseboard_South", new Vector3(0f, 0.35f, -19.7f), new Vector3(60f, 0.2f, 0.15f), baseboardColor, parent);
        CreateBox("Baseboard_East", new Vector3(29.7f, 0.35f, 10f), new Vector3(0.15f, 0.2f, 80f), baseboardColor, parent);
        CreateBox("Baseboard_West", new Vector3(-29.7f, 0.35f, 10f), new Vector3(0.15f, 0.2f, 80f), baseboardColor, parent);

        // Ceiling pipes
        Color pipeColor = new Color(0.35f, 0.35f, 0.3f);
        GameObject pipe1 = CreateCylinder("CeilingPipe_1", new Vector3(0f, 4.8f, -5f), new Vector3(0.1f, 15f, 0.1f), pipeColor, parent);
        pipe1.transform.rotation = Quaternion.Euler(0f, 0f, 90f);
        GameObject pipe2 = CreateCylinder("CeilingPipe_2", new Vector3(0f, 4.8f, 5f), new Vector3(0.1f, 15f, 0.1f), pipeColor, parent);
        pipe2.transform.rotation = Quaternion.Euler(0f, 0f, 90f);
        GameObject pipe3 = CreateCylinder("CeilingPipe_3", new Vector3(0f, 4.8f, 15f), new Vector3(0.1f, 15f, 0.1f), pipeColor, parent);
        pipe3.transform.rotation = Quaternion.Euler(0f, 0f, 90f);
        GameObject pipe4 = CreateCylinder("CeilingPipe_4", new Vector3(0f, 4.8f, -15f), new Vector3(0.08f, 12f, 0.08f), pipeColor, parent);
        pipe4.transform.rotation = Quaternion.Euler(0f, 0f, 90f);

        // Wall cracks
        Color crackColor = new Color(0.15f, 0.15f, 0.12f);
        CreateBox("Crack_1", new Vector3(29.7f, 2.0f, -5f), new Vector3(0.02f, 0.6f, 0.01f), crackColor, parent);
        CreateBox("Crack_2", new Vector3(29.7f, 3.2f, 8f), new Vector3(0.02f, 0.8f, 0.01f), crackColor, parent);
        CreateBox("Crack_3", new Vector3(-29.7f, 1.5f, -10f), new Vector3(0.02f, 0.5f, 0.01f), crackColor, parent);
        CreateBox("Crack_4", new Vector3(-29.7f, 3.8f, 15f), new Vector3(0.02f, 0.3f, 0.01f), crackColor, parent);
        CreateBox("Crack_5", new Vector3(15f, 2.5f, 39.7f), new Vector3(0.01f, 0.7f, 0.02f), crackColor, parent);
        CreateBox("Crack_6", new Vector3(-10f, 1.8f, -19.7f), new Vector3(0.01f, 0.4f, 0.02f), crackColor, parent);
        CreateBox("Crack_7", new Vector3(20f, 3.5f, 39.7f), new Vector3(0.01f, 0.5f, 0.02f), crackColor, parent);

        // Mortar lines (horizontal strips on walls suggesting brick pattern)
        Color mortarColor = new Color(0.65f, 0.63f, 0.58f);
        for (int row = 0; row < 5; row++)
        {
            float y = 0.8f + row * 0.9f;
            CreateBox("MortarN_" + row, new Vector3(0f, y, 39.72f), new Vector3(60f, 0.02f, 0.01f), mortarColor, parent);
            CreateBox("MortarS_" + row, new Vector3(0f, y, -19.72f), new Vector3(60f, 0.02f, 0.01f), mortarColor, parent);
            CreateBox("MortarE_" + row, new Vector3(29.72f, y, 10f), new Vector3(0.01f, 0.02f, 80f), mortarColor, parent);
            CreateBox("MortarW_" + row, new Vector3(-29.72f, y, 10f), new Vector3(0.01f, 0.02f, 80f), mortarColor, parent);
        }
    }

    private static void CreateCellBlock(Transform parent)
    {
        GameObject cellBlock = new GameObject("CellBlock");
        cellBlock.transform.SetParent(parent);
        Transform cb = cellBlock.transform;

        Color wallColor = new Color(0.55f, 0.55f, 0.5f);
        Color bedColor = new Color(0.3f, 0.25f, 0.2f);
        Color mattressColor = new Color(0.4f, 0.5f, 0.6f);
        Color toiletColor = new Color(0.9f, 0.9f, 0.9f);
        Color barColor = new Color(0.3f, 0.3f, 0.35f);
        Color pillowColor = new Color(0.7f, 0.7f, 0.75f);
        Color sinkColor = new Color(0.85f, 0.85f, 0.9f);
        Color mirrorColor = new Color(0.75f, 0.8f, 0.85f);
        Color shelfColor = new Color(0.4f, 0.35f, 0.25f);
        Color markingColor1 = new Color(0.2f, 0.2f, 0.6f);
        Color markingColor2 = new Color(0.6f, 0.2f, 0.2f);

        for (int side = 0; side < 2; side++)
        {
            float xOffset = side == 0 ? 5f : -5f;
            for (int i = 0; i < 3; i++)
            {
                float zPos = -15f + i * 10f;
                string cellName = "Cell_" + side + "_" + i;
                GameObject cell = new GameObject(cellName);
                cell.transform.SetParent(cb);
                Transform ct = cell.transform;

                // Walls
                CreateBox(cellName + "_BackWall", new Vector3(xOffset + (side == 0 ? 2.5f : -2.5f), 2.5f, zPos), new Vector3(0.3f, 5f, 5f), wallColor, ct);
                CreateBox(cellName + "_SideWallA", new Vector3(xOffset, 2.5f, zPos + 2.5f), new Vector3(5f, 5f, 0.3f), wallColor, ct);
                CreateBox(cellName + "_SideWallB", new Vector3(xOffset, 2.5f, zPos - 2.5f), new Vector3(5f, 5f, 0.3f), wallColor, ct);

                // Bed with headboard, legs, pillow
                float bedX = xOffset + (side == 0 ? 1.5f : -1.5f);
                CreateBox(cellName + "_BedFrame", new Vector3(bedX, 0.4f, zPos - 1f), new Vector3(1.2f, 0.4f, 2f), bedColor, ct);
                CreateBox(cellName + "_Mattress", new Vector3(bedX, 0.65f, zPos - 1f), new Vector3(1f, 0.15f, 1.8f), mattressColor, ct);
                // Headboard
                CreateBox(cellName + "_Headboard", new Vector3(bedX, 0.9f, zPos - 2f), new Vector3(1.2f, 0.7f, 0.08f), bedColor, ct);
                // Pillow
                CreateBox(cellName + "_Pillow", new Vector3(bedX, 0.78f, zPos - 1.7f), new Vector3(0.5f, 0.1f, 0.3f), pillowColor, ct);
                // 4 Bed legs
                CreateCylinder(cellName + "_BedLeg1", new Vector3(bedX - 0.5f, 0.15f, zPos - 1.9f), new Vector3(0.06f, 0.15f, 0.06f), bedColor, ct);
                CreateCylinder(cellName + "_BedLeg2", new Vector3(bedX + 0.5f, 0.15f, zPos - 1.9f), new Vector3(0.06f, 0.15f, 0.06f), bedColor, ct);
                CreateCylinder(cellName + "_BedLeg3", new Vector3(bedX - 0.5f, 0.15f, zPos - 0.1f), new Vector3(0.06f, 0.15f, 0.06f), bedColor, ct);
                CreateCylinder(cellName + "_BedLeg4", new Vector3(bedX + 0.5f, 0.15f, zPos - 0.1f), new Vector3(0.06f, 0.15f, 0.06f), bedColor, ct);

                // Toilet with tank and flush handle
                float toiletX = xOffset + (side == 0 ? 1.8f : -1.8f);
                CreateBox(cellName + "_ToiletBase", new Vector3(toiletX, 0.3f, zPos + 1.5f), new Vector3(0.5f, 0.6f, 0.5f), toiletColor, ct);
                CreateBox(cellName + "_ToiletTop", new Vector3(toiletX, 0.65f, zPos + 1.5f), new Vector3(0.5f, 0.1f, 0.6f), toiletColor, ct);
                float tankZ = zPos + 1.8f;
                CreateBox(cellName + "_ToiletTank", new Vector3(toiletX, 0.6f, tankZ), new Vector3(0.4f, 0.5f, 0.2f), toiletColor, ct);
                CreateCylinder(cellName + "_FlushHandle", new Vector3(toiletX + 0.2f, 0.85f, tankZ), new Vector3(0.03f, 0.06f, 0.03f), new Color(0.6f, 0.6f, 0.6f), ct);

                // Sink on opposite wall from toilet
                float sinkX = xOffset + (side == 0 ? 1.8f : -1.8f);
                float sinkZ = zPos - 0.5f;
                float sinkWallX = xOffset + (side == 0 ? 2.3f : -2.3f);
                CreateBox(cellName + "_SinkPedestal", new Vector3(sinkWallX, 0.5f, sinkZ), new Vector3(0.3f, 1f, 0.3f), sinkColor, ct);
                CreateCylinder(cellName + "_SinkBasin", new Vector3(sinkWallX, 0.95f, sinkZ), new Vector3(0.35f, 0.05f, 0.35f), sinkColor, ct);

                // Mirror above sink
                CreateBox(cellName + "_Mirror", new Vector3(sinkWallX, 1.6f, sinkZ), new Vector3(0.02f, 0.5f, 0.4f), mirrorColor, ct);

                // Shelf on wall
                float shelfX = xOffset + (side == 0 ? 2.3f : -2.3f);
                CreateBox(cellName + "_Shelf", new Vector3(shelfX, 1.8f, zPos + 0.5f), new Vector3(0.15f, 0.05f, 0.5f), shelfColor, ct);

                // Wall markings (tally marks / scratches)
                float markWallX = xOffset + (side == 0 ? 2.33f : -2.33f);
                CreateBox(cellName + "_Mark1", new Vector3(markWallX, 1.2f, zPos + 1.0f), new Vector3(0.01f, 0.15f, 0.02f), markingColor1, ct);
                CreateBox(cellName + "_Mark2", new Vector3(markWallX, 1.2f, zPos + 1.05f), new Vector3(0.01f, 0.15f, 0.02f), markingColor1, ct);
                CreateBox(cellName + "_Mark3", new Vector3(markWallX, 1.2f, zPos + 1.1f), new Vector3(0.01f, 0.15f, 0.02f), markingColor2, ct);

                // Cell bars with horizontal cross bars
                float barX = xOffset + (side == 0 ? -2.5f : 2.5f);
                GameObject doorObj = new GameObject(cellName + "_Bars");
                doorObj.transform.position = new Vector3(barX, 0f, zPos);
                doorObj.transform.SetParent(ct);

                for (int b = 0; b < 6; b++)
                {
                    float bz = zPos - 2f + b * 0.8f;
                    CreateCylinder(cellName + "_Bar_" + b, new Vector3(barX, 2.5f, bz), new Vector3(0.08f, 2.5f, 0.08f), barColor, doorObj.transform);
                }
                CreateBox(cellName + "_BarTop", new Vector3(barX, 4.9f, zPos), new Vector3(0.15f, 0.2f, 5f), barColor, doorObj.transform);
                CreateBox(cellName + "_BarBottom", new Vector3(barX, 0.1f, zPos), new Vector3(0.15f, 0.2f, 5f), barColor, doorObj.transform);
                // Horizontal cross bars
                CreateBox(cellName + "_CrossBar1", new Vector3(barX, 1.5f, zPos), new Vector3(0.06f, 0.06f, 4.5f), barColor, doorObj.transform);
                CreateBox(cellName + "_CrossBar2", new Vector3(barX, 3.0f, zPos), new Vector3(0.06f, 0.06f, 4.5f), barColor, doorObj.transform);
                CreateBox(cellName + "_CrossBar3", new Vector3(barX, 4.2f, zPos), new Vector3(0.06f, 0.06f, 4.5f), barColor, doorObj.transform);

                BoxCollider doorCol = doorObj.AddComponent<BoxCollider>();
                doorCol.center = new Vector3(0f, 2.5f, 0f);
                doorCol.size = new Vector3(0.3f, 5f, 5f);
                DoorController dc = doorObj.AddComponent<DoorController>();
                dc.doorType = DoorType.CellDoor;
                dc.closedPosition = doorObj.transform.localPosition;
                dc.openPosition = doorObj.transform.localPosition + Vector3.up * 5f;

                // Cell light with FlickerLight on every other cell
                GameObject cellLight = CreateLight(cellName + "_Light", new Vector3(xOffset, 4.5f, zPos), new Color(1f, 0.9f, 0.7f), 6f, 1f, ct);
                if ((side + i) % 2 == 0)
                {
                    cellLight.AddComponent<FlickerLight>();
                }
            }
        }
    }

    private static void CreateMainCorridor(Transform parent)
    {
        GameObject corridor = new GameObject("MainCorridor");
        corridor.transform.SetParent(parent);
        Transform cr = corridor.transform;

        Color floorColor = new Color(0.45f, 0.42f, 0.4f);
        CreateBox("CorridorFloor", new Vector3(0f, 0.26f, 0f), new Vector3(4f, 0.02f, 36f), floorColor, cr);

        for (int i = 0; i < 4; i++)
        {
            float z = -15f + i * 10f;
            GameObject corridorLight = CreateLight("CorridorLight_" + i, new Vector3(0f, 4.5f, z), new Color(1f, 0.95f, 0.8f), 8f, 1.2f, cr);
            // Add flicker to every other corridor light
            if (i % 2 == 0)
            {
                corridorLight.AddComponent<FlickerLight>();
            }
        }
    }

    private static void CreateGuardRoom(Transform parent)
    {
        GameObject guardRoom = new GameObject("GuardRoom");
        guardRoom.transform.SetParent(parent);
        Transform gr = guardRoom.transform;

        Color wallColor = new Color(0.5f, 0.55f, 0.6f);
        Color deskColor = new Color(0.4f, 0.3f, 0.2f);
        Color monitorColor = new Color(0.1f, 0.1f, 0.15f);

        CreateBox("GR_Floor", new Vector3(-12f, 0.26f, -12f), new Vector3(8f, 0.02f, 8f), new Color(0.35f, 0.35f, 0.4f), gr);
        CreateBox("GR_WallN", new Vector3(-12f, 2.5f, -8f), new Vector3(8f, 5f, 0.3f), wallColor, gr);
        CreateBox("GR_WallS", new Vector3(-12f, 2.5f, -16f), new Vector3(8f, 5f, 0.3f), wallColor, gr);
        CreateBox("GR_WallW", new Vector3(-16f, 2.5f, -12f), new Vector3(0.3f, 5f, 8f), wallColor, gr);
        CreateBox("GR_WallE", new Vector3(-8f, 2.5f, -12f), new Vector3(0.3f, 5f, 4f), wallColor, gr);

        // Desk and 4 monitors
        CreateBox("GR_Desk", new Vector3(-13f, 0.8f, -12f), new Vector3(2f, 0.8f, 1.2f), deskColor, gr);
        CreateBox("GR_Monitor1", new Vector3(-13.8f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Monitor2", new Vector3(-13.2f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Monitor3", new Vector3(-12.6f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Monitor4", new Vector3(-12.0f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Chair", new Vector3(-13f, 0.5f, -11f), new Vector3(0.6f, 0.5f, 0.6f), new Color(0.2f, 0.2f, 0.3f), gr);

        // Coffee mug on desk
        CreateCylinder("GR_CoffeeMug", new Vector3(-12.2f, 1.0f, -11.5f), new Vector3(0.08f, 0.12f, 0.08f), new Color(0.4f, 0.25f, 0.1f), gr);

        // Filing cabinet
        Color cabinetColor = new Color(0.4f, 0.4f, 0.45f);
        CreateBox("GR_FilingCabinet", new Vector3(-15.5f, 1.0f, -14f), new Vector3(0.6f, 2f, 0.5f), cabinetColor, gr);
        CreateBox("GR_CabinetLine1", new Vector3(-15.5f, 0.5f, -13.74f), new Vector3(0.5f, 0.02f, 0.01f), new Color(0.15f, 0.15f, 0.15f), gr);
        CreateBox("GR_CabinetLine2", new Vector3(-15.5f, 1.0f, -13.74f), new Vector3(0.5f, 0.02f, 0.01f), new Color(0.15f, 0.15f, 0.15f), gr);
        CreateBox("GR_CabinetLine3", new Vector3(-15.5f, 1.5f, -13.74f), new Vector3(0.5f, 0.02f, 0.01f), new Color(0.15f, 0.15f, 0.15f), gr);
        CreateBox("GR_CabinetLine4", new Vector3(-15.5f, 1.8f, -13.74f), new Vector3(0.5f, 0.02f, 0.01f), new Color(0.15f, 0.15f, 0.15f), gr);

        // Weapon rack on wall
        CreateBox("GR_WeaponRackMount", new Vector3(-15.8f, 2.5f, -10f), new Vector3(0.1f, 0.1f, 1.5f), new Color(0.25f, 0.25f, 0.2f), gr);
        CreateCylinder("GR_RackGun1", new Vector3(-15.7f, 2.2f, -10.3f), new Vector3(0.05f, 0.4f, 0.05f), new Color(0.2f, 0.2f, 0.25f), gr);
        CreateCylinder("GR_RackGun2", new Vector3(-15.7f, 2.2f, -9.7f), new Vector3(0.05f, 0.4f, 0.05f), new Color(0.2f, 0.2f, 0.25f), gr);

        // Radio equipment
        CreateBox("GR_Radio1", new Vector3(-15.5f, 1.2f, -9f), new Vector3(0.3f, 0.2f, 0.2f), new Color(0.15f, 0.15f, 0.2f), gr);
        CreateBox("GR_Radio2", new Vector3(-15.5f, 1.2f, -8.6f), new Vector3(0.25f, 0.25f, 0.2f), new Color(0.15f, 0.15f, 0.2f), gr);
        CreateCylinder("GR_Antenna1", new Vector3(-15.5f, 1.6f, -9f), new Vector3(0.02f, 0.3f, 0.02f), new Color(0.6f, 0.6f, 0.6f), gr);
        CreateCylinder("GR_Antenna2", new Vector3(-15.5f, 1.7f, -8.6f), new Vector3(0.02f, 0.35f, 0.02f), new Color(0.6f, 0.6f, 0.6f), gr);

        // Whiteboard on wall
        CreateBox("GR_Whiteboard", new Vector3(-12f, 2.8f, -15.8f), new Vector3(2f, 1.5f, 0.05f), new Color(0.95f, 0.95f, 0.95f), gr);

        // Door button panel
        GameObject buttonPanel = CreateBox("DoorButtonPanel", new Vector3(-8.2f, 1.5f, -10f), new Vector3(0.1f, 0.4f, 0.4f), Color.red, gr);
        buttonPanel.AddComponent<BoxCollider>();
        buttonPanel.AddComponent<DoorButton>();

        CreateLight("GR_Light", new Vector3(-12f, 4.5f, -12f), new Color(0.9f, 0.9f, 1f), 8f, 1.5f, gr);
    }

    private static void CreateArmory(Transform parent)
    {
        GameObject armory = new GameObject("Armory");
        armory.transform.SetParent(parent);
        Transform ar = armory.transform;

        Color wallColor = new Color(0.45f, 0.45f, 0.5f);
        Color rackColor = new Color(0.3f, 0.3f, 0.25f);
        Color crateColor = new Color(0.35f, 0.3f, 0.15f);

        CreateBox("AR_Floor", new Vector3(-12f, 0.26f, -4f), new Vector3(6f, 0.02f, 6f), new Color(0.3f, 0.3f, 0.35f), ar);
        CreateBox("AR_WallN", new Vector3(-12f, 2.5f, -1f), new Vector3(6f, 5f, 0.3f), wallColor, ar);
        CreateBox("AR_WallS", new Vector3(-12f, 2.5f, -7f), new Vector3(6f, 5f, 0.3f), wallColor, ar);
        CreateBox("AR_WallW", new Vector3(-15f, 2.5f, -4f), new Vector3(0.3f, 5f, 6f), wallColor, ar);

        CreateBox("AR_Rack1", new Vector3(-14f, 1.5f, -4f), new Vector3(0.3f, 2f, 3f), rackColor, ar);
        CreateBox("AR_Rack2", new Vector3(-14f, 2.5f, -4f), new Vector3(0.3f, 0.1f, 3f), rackColor, ar);
        CreateBox("AR_Crate1", new Vector3(-12f, 0.5f, -5.5f), new Vector3(1f, 1f, 1f), crateColor, ar);
        CreateBox("AR_Crate2", new Vector3(-11f, 0.5f, -5.5f), new Vector3(1f, 1f, 1f), crateColor, ar);

        GameObject armoryDoor = CreateBox("ArmoryDoor", new Vector3(-9f, 2.5f, -4f), new Vector3(0.3f, 5f, 2f), new Color(0.4f, 0.4f, 0.5f), ar);
        DoorController armDC = armoryDoor.AddComponent<DoorController>();
        armDC.doorType = DoorType.ArmoryDoor;
        armDC.closedPosition = armoryDoor.transform.localPosition;
        armDC.openPosition = armoryDoor.transform.localPosition + Vector3.up * 5f;

        CreateLight("AR_Light", new Vector3(-12f, 4.5f, -4f), new Color(0.8f, 0.85f, 1f), 7f, 1.3f, ar);
    }

    private static void CreateYard(Transform parent)
    {
        GameObject yard = new GameObject("Yard");
        yard.transform.SetParent(parent);
        Transform yr = yard.transform;

        Color grassColor = new Color(0.3f, 0.5f, 0.25f);
        Color lineColor = new Color(0.9f, 0.9f, 0.9f);
        Color towerColor = new Color(0.5f, 0.5f, 0.45f);
        Color railColor = new Color(0.3f, 0.3f, 0.3f);

        CreateBox("Yard_Floor", new Vector3(0f, 0.25f, 35f), new Vector3(20f, 0.01f, 18f), grassColor, yr);

        CreateBox("Court_LineN", new Vector3(0f, 0.27f, 40f), new Vector3(12f, 0.02f, 0.1f), lineColor, yr);
        CreateBox("Court_LineS", new Vector3(0f, 0.27f, 30f), new Vector3(12f, 0.02f, 0.1f), lineColor, yr);
        CreateBox("Court_LineE", new Vector3(6f, 0.27f, 35f), new Vector3(0.1f, 0.02f, 10f), lineColor, yr);
        CreateBox("Court_LineW", new Vector3(-6f, 0.27f, 35f), new Vector3(0.1f, 0.02f, 10f), lineColor, yr);
        CreateBox("Court_Center", new Vector3(0f, 0.27f, 35f), new Vector3(4f, 0.02f, 0.1f), lineColor, yr);

        CreateWatchTower("Tower_NE", new Vector3(9f, 0f, 43f), yr, towerColor, railColor);
        CreateWatchTower("Tower_NW", new Vector3(-9f, 0f, 43f), yr, towerColor, railColor);

        // Basketball hoop
        Color hoopColor = new Color(0.8f, 0.3f, 0.1f);
        Color poleColor = new Color(0.5f, 0.5f, 0.5f);
        CreateCylinder("Yard_HoopPole", new Vector3(0f, 2f, 40f), new Vector3(0.1f, 2f, 0.1f), poleColor, yr);
        CreateBox("Yard_Backboard", new Vector3(0f, 4.0f, 40.1f), new Vector3(1.2f, 0.8f, 0.05f), new Color(0.9f, 0.9f, 0.9f), yr);
        CreateCylinder("Yard_HoopRing", new Vector3(0f, 3.6f, 39.7f), new Vector3(0.5f, 0.03f, 0.5f), hoopColor, yr);

        // Weight bench
        Color metalColor = new Color(0.4f, 0.4f, 0.4f);
        CreateBox("Yard_BenchSeat", new Vector3(7f, 0.5f, 35f), new Vector3(0.5f, 0.1f, 1.5f), new Color(0.2f, 0.2f, 0.2f), yr);
        CreateBox("Yard_BenchUpright1", new Vector3(7f, 1.0f, 35.7f), new Vector3(0.08f, 1f, 0.08f), metalColor, yr);
        CreateBox("Yard_BenchUpright2", new Vector3(7f, 1.0f, 34.3f), new Vector3(0.08f, 1f, 0.08f), metalColor, yr);
        CreateCylinder("Yard_Barbell", new Vector3(7f, 1.5f, 35f), new Vector3(0.04f, 0.8f, 0.04f), metalColor, yr);
        CreateSphere("Yard_Weight1", new Vector3(7f, 1.5f, 35.8f), new Vector3(0.25f, 0.25f, 0.08f), new Color(0.15f, 0.15f, 0.15f), yr);
        CreateSphere("Yard_Weight2", new Vector3(7f, 1.5f, 34.2f), new Vector3(0.25f, 0.25f, 0.08f), new Color(0.15f, 0.15f, 0.15f), yr);

        // Chain-link fence along one side (east, z=26 to z=44)
        Color fenceColor = new Color(0.5f, 0.5f, 0.5f);
        // Vertical bars
        for (int v = 0; v < 18; v++)
        {
            float z = 26f + v * 1f;
            CreateCylinder("Fence_V_" + v, new Vector3(10f, 1.5f, z), new Vector3(0.03f, 1.5f, 0.03f), fenceColor, yr);
        }
        // Horizontal bars
        for (int h = 0; h < 6; h++)
        {
            float y = 0.5f + h * 0.5f;
            GameObject fh = CreateCylinder("Fence_H_" + h, new Vector3(10f, y, 35f), new Vector3(0.02f, 9f, 0.02f), fenceColor, yr);
            fh.transform.rotation = Quaternion.Euler(0f, 0f, 90f);
        }

        // Trash cans
        Color trashColor = new Color(0.3f, 0.35f, 0.3f);
        CreateCylinder("Yard_TrashCan1", new Vector3(-8f, 0.5f, 35f), new Vector3(0.3f, 0.5f, 0.3f), trashColor, yr);
        CreateCylinder("Yard_TrashLid1", new Vector3(-8f, 1.0f, 35f), new Vector3(0.35f, 0.03f, 0.35f), new Color(0.25f, 0.25f, 0.25f), yr);
        CreateCylinder("Yard_TrashCan2", new Vector3(-7f, 0.5f, 35.5f), new Vector3(0.3f, 0.5f, 0.3f), trashColor, yr);
        CreateCylinder("Yard_TrashLid2", new Vector3(-7f, 1.0f, 35.5f), new Vector3(0.35f, 0.03f, 0.35f), new Color(0.25f, 0.25f, 0.25f), yr);
        CreateCylinder("Yard_TrashCan3", new Vector3(-7.5f, 0.5f, 36.5f), new Vector3(0.3f, 0.5f, 0.3f), trashColor, yr);
        CreateCylinder("Yard_TrashLid3", new Vector3(-7.5f, 1.0f, 36.5f), new Vector3(0.35f, 0.03f, 0.35f), new Color(0.25f, 0.25f, 0.25f), yr);

        // Picnic tables (replacing benches)
        Color tableColor = new Color(0.4f, 0.3f, 0.2f);
        Color benchWoodColor = new Color(0.45f, 0.35f, 0.2f);
        CreatePicnicTable("PicnicTable_1", new Vector3(-8f, 0f, 28f), yr, tableColor, benchWoodColor);
        CreatePicnicTable("PicnicTable_2", new Vector3(8f, 0f, 28f), yr, tableColor, benchWoodColor);
        CreatePicnicTable("PicnicTable_3", new Vector3(-8f, 0f, 42f), yr, tableColor, benchWoodColor);
        CreatePicnicTable("PicnicTable_4", new Vector3(8f, 0f, 42f), yr, tableColor, benchWoodColor);
    }

    private static void CreatePicnicTable(string name, Vector3 pos, Transform parent, Color tableColor, Color benchColor)
    {
        // Table top
        CreateBox(name + "_Top", pos + new Vector3(0f, 0.8f, 0f), new Vector3(2f, 0.08f, 0.8f), tableColor, parent);
        // Two bench seats
        CreateBox(name + "_BenchA", pos + new Vector3(0f, 0.45f, -0.5f), new Vector3(2f, 0.06f, 0.35f), benchColor, parent);
        CreateBox(name + "_BenchB", pos + new Vector3(0f, 0.45f, 0.5f), new Vector3(2f, 0.06f, 0.35f), benchColor, parent);
        // Leg supports (angled represented as boxes)
        CreateBox(name + "_Leg1", pos + new Vector3(-0.7f, 0.4f, 0f), new Vector3(0.08f, 0.8f, 0.8f), tableColor, parent);
        CreateBox(name + "_Leg2", pos + new Vector3(0.7f, 0.4f, 0f), new Vector3(0.08f, 0.8f, 0.8f), tableColor, parent);
    }

    private static void CreateWatchTower(string name, Vector3 basePos, Transform parent, Color towerColor, Color railColor)
    {
        GameObject tower = new GameObject(name);
        tower.transform.position = basePos;
        tower.transform.SetParent(parent);
        Transform t = tower.transform;

        float pillarHeight = 8f;
        CreateCylinder(name + "_Leg1", basePos + new Vector3(-1f, pillarHeight / 2f, -1f), new Vector3(0.3f, pillarHeight / 2f, 0.3f), towerColor, t);
        CreateCylinder(name + "_Leg2", basePos + new Vector3(1f, pillarHeight / 2f, -1f), new Vector3(0.3f, pillarHeight / 2f, 0.3f), towerColor, t);
        CreateCylinder(name + "_Leg3", basePos + new Vector3(-1f, pillarHeight / 2f, 1f), new Vector3(0.3f, pillarHeight / 2f, 0.3f), towerColor, t);
        CreateCylinder(name + "_Leg4", basePos + new Vector3(1f, pillarHeight / 2f, 1f), new Vector3(0.3f, pillarHeight / 2f, 0.3f), towerColor, t);

        CreateBox(name + "_Platform", basePos + new Vector3(0f, pillarHeight, 0f), new Vector3(3f, 0.3f, 3f), towerColor, t);

        CreateBox(name + "_RailN", basePos + new Vector3(0f, pillarHeight + 1f, 1.4f), new Vector3(3f, 1f, 0.1f), railColor, t);
        CreateBox(name + "_RailS", basePos + new Vector3(0f, pillarHeight + 1f, -1.4f), new Vector3(3f, 1f, 0.1f), railColor, t);
        CreateBox(name + "_RailE", basePos + new Vector3(1.4f, pillarHeight + 1f, 0f), new Vector3(0.1f, 1f, 3f), railColor, t);
        CreateBox(name + "_RailW", basePos + new Vector3(-1.4f, pillarHeight + 1f, 0f), new Vector3(0.1f, 1f, 3f), railColor, t);
    }

    private static void CreateVentilationShaft(Transform parent)
    {
        GameObject vents = new GameObject("VentilationShaft");
        vents.transform.SetParent(parent);
        Transform vt = vents.transform;

        Color ventColor = new Color(0.35f, 0.35f, 0.4f);

        CreateBox("Vent_Entry", new Vector3(5f, 4.5f, -10f), new Vector3(1.2f, 1.2f, 1.2f), ventColor, vt);
        CreateBox("Vent_Shaft1", new Vector3(5f, 5.2f, -7f), new Vector3(1.2f, 1.2f, 5f), ventColor, vt);
        CreateBox("Vent_Shaft2", new Vector3(5f, 5.2f, 0f), new Vector3(1.2f, 1.2f, 8f), ventColor, vt);
        CreateBox("Vent_Shaft3", new Vector3(5f, 5.2f, 10f), new Vector3(1.2f, 1.2f, 12f), ventColor, vt);
        CreateBox("Vent_Exit", new Vector3(5f, 4.0f, 26f), new Vector3(1.2f, 1.2f, 1.2f), ventColor, vt);

        CreateBox("Vent_Floor1", new Vector3(5f, 4.0f, -7f), new Vector3(1.1f, 0.1f, 5f), new Color(0.3f, 0.3f, 0.3f), vt);
        CreateBox("Vent_Floor2", new Vector3(5f, 4.0f, 0f), new Vector3(1.1f, 0.1f, 8f), new Color(0.3f, 0.3f, 0.3f), vt);
        CreateBox("Vent_Floor3", new Vector3(5f, 4.0f, 10f), new Vector3(1.1f, 0.1f, 12f), new Color(0.3f, 0.3f, 0.3f), vt);
    }

    private static void CreateMedicRoom(Transform parent)
    {
        GameObject medic = new GameObject("MedicRoom");
        medic.transform.SetParent(parent);
        Transform mr = medic.transform;

        Color wallColor = new Color(0.8f, 0.85f, 0.8f);
        Color tableColor = new Color(0.7f, 0.75f, 0.8f);
        Color cabinetColor = new Color(0.6f, 0.65f, 0.7f);

        CreateBox("MR_Floor", new Vector3(10f, 0.26f, 0f), new Vector3(5f, 0.02f, 5f), new Color(0.75f, 0.8f, 0.75f), mr);
        CreateBox("MR_WallN", new Vector3(10f, 2.5f, 2.5f), new Vector3(5f, 5f, 0.3f), wallColor, mr);
        CreateBox("MR_WallS", new Vector3(10f, 2.5f, -2.5f), new Vector3(5f, 5f, 0.3f), wallColor, mr);
        CreateBox("MR_WallE", new Vector3(12.5f, 2.5f, 0f), new Vector3(0.3f, 5f, 5f), wallColor, mr);

        CreateBox("MR_Table", new Vector3(10f, 0.9f, 0f), new Vector3(2f, 0.9f, 1f), tableColor, mr);
        CreateBox("MR_Cabinet", new Vector3(12f, 1.5f, 0f), new Vector3(0.5f, 2f, 1.5f), cabinetColor, mr);
        CreateBox("MR_Medkit", new Vector3(10f, 1.2f, 0f), new Vector3(0.4f, 0.3f, 0.3f), Color.red, mr);

        CreateLight("MR_Light", new Vector3(10f, 4.5f, 0f), new Color(1f, 1f, 1f), 6f, 1.5f, mr);
    }

    private static void CreateCafeteria(Transform parent)
    {
        GameObject cafeteria = new GameObject("Cafeteria");
        cafeteria.transform.SetParent(parent);
        Transform cf = cafeteria.transform;

        Color wallColor = new Color(0.6f, 0.58f, 0.5f);
        Color tableColor = new Color(0.5f, 0.4f, 0.3f);
        Color benchColor = new Color(0.45f, 0.35f, 0.25f);
        Color counterColor = new Color(0.55f, 0.5f, 0.45f);

        CreateBox("CF_Floor", new Vector3(10f, 0.26f, 10f), new Vector3(10f, 0.02f, 8f), new Color(0.5f, 0.45f, 0.4f), cf);
        CreateBox("CF_WallN", new Vector3(10f, 2.5f, 14f), new Vector3(10f, 5f, 0.3f), wallColor, cf);
        CreateBox("CF_WallS", new Vector3(10f, 2.5f, 6f), new Vector3(10f, 5f, 0.3f), wallColor, cf);
        CreateBox("CF_WallE", new Vector3(15f, 2.5f, 10f), new Vector3(0.3f, 5f, 8f), wallColor, cf);

        for (int i = 0; i < 4; i++)
        {
            float z = 7.5f + i * 2f;
            CreateBox("CF_Table_" + i, new Vector3(10f, 0.8f, z), new Vector3(4f, 0.1f, 1f), tableColor, cf);
            CreateBox("CF_BenchA_" + i, new Vector3(10f, 0.45f, z - 0.6f), new Vector3(4f, 0.4f, 0.3f), benchColor, cf);
            CreateBox("CF_BenchB_" + i, new Vector3(10f, 0.45f, z + 0.6f), new Vector3(4f, 0.4f, 0.3f), benchColor, cf);

            // Food trays on first 2 tables
            if (i < 2)
            {
                Color trayColor = new Color(0.7f, 0.65f, 0.5f);
                CreateBox("CF_Tray_" + i, new Vector3(10f + 0.5f, 0.88f, z), new Vector3(0.4f, 0.02f, 0.3f), trayColor, cf);
                // Food items
                CreateBox("CF_Food1_" + i, new Vector3(10f + 0.4f, 0.92f, z - 0.05f), new Vector3(0.1f, 0.06f, 0.08f), new Color(0.6f, 0.3f, 0.1f), cf);
                CreateBox("CF_Food2_" + i, new Vector3(10f + 0.6f, 0.92f, z + 0.05f), new Vector3(0.08f, 0.08f, 0.08f), new Color(0.2f, 0.6f, 0.2f), cf);
            }
        }

        CreateBox("CF_Counter", new Vector3(14f, 1f, 10f), new Vector3(1.5f, 1f, 6f), counterColor, cf);

        // Serving window (gap in east wall represented by counter ledge)
        CreateBox("CF_ServingLedge", new Vector3(14.9f, 1.2f, 10f), new Vector3(0.3f, 0.08f, 2f), counterColor, cf);

        // Kitchen area behind counter
        Color stoveColor = new Color(0.2f, 0.2f, 0.2f);
        CreateBox("CF_Stove", new Vector3(14.8f, 0.8f, 10f), new Vector3(1f, 0.8f, 1f), stoveColor, cf);
        // Burners on stove
        Color burnerColor = new Color(0.1f, 0.1f, 0.1f);
        CreateCylinder("CF_Burner1", new Vector3(14.6f, 0.85f, 9.7f), new Vector3(0.15f, 0.01f, 0.15f), burnerColor, cf);
        CreateCylinder("CF_Burner2", new Vector3(14.6f, 0.85f, 10.3f), new Vector3(0.15f, 0.01f, 0.15f), burnerColor, cf);
        CreateCylinder("CF_Burner3", new Vector3(15.0f, 0.85f, 9.7f), new Vector3(0.15f, 0.01f, 0.15f), burnerColor, cf);
        CreateCylinder("CF_Burner4", new Vector3(15.0f, 0.85f, 10.3f), new Vector3(0.15f, 0.01f, 0.15f), burnerColor, cf);
        // Pots on stove
        CreateCylinder("CF_Pot1", new Vector3(14.6f, 1.0f, 9.7f), new Vector3(0.12f, 0.1f, 0.12f), new Color(0.5f, 0.5f, 0.5f), cf);
        CreateCylinder("CF_Pot2", new Vector3(15.0f, 1.0f, 10.3f), new Vector3(0.14f, 0.12f, 0.14f), new Color(0.5f, 0.5f, 0.5f), cf);

        CreateLight("CF_Light1", new Vector3(9f, 4.5f, 9f), new Color(1f, 0.9f, 0.7f), 7f, 1.2f, cf);
        CreateLight("CF_Light2", new Vector3(9f, 4.5f, 12f), new Color(1f, 0.9f, 0.7f), 7f, 1.2f, cf);
    }

    private static void CreatePlayer()
    {
        GameObject player = new GameObject("Player");
        player.tag = "Player";
        player.transform.position = new Vector3(0f, 1f, -18f);

        CharacterController cc = player.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.4f;
        cc.center = new Vector3(0f, 1f, 0f);

        PlayerController pc = player.AddComponent<PlayerController>();
        HealthSystem hs = player.AddComponent<HealthSystem>();
        DamageReceiver dr = player.AddComponent<DamageReceiver>();
        WeaponController wc = player.AddComponent<WeaponController>();

        GameObject cameraObj = new GameObject("PlayerCamera");
        cameraObj.transform.SetParent(player.transform);
        cameraObj.transform.localPosition = new Vector3(0f, 1.7f, 0f);
        Camera cam = cameraObj.AddComponent<Camera>();
        cameraObj.AddComponent<AudioListener>();

        GameObject weaponHolder = new GameObject("WeaponHolder");
        weaponHolder.transform.SetParent(cameraObj.transform);
        weaponHolder.transform.localPosition = new Vector3(0.3f, -0.2f, 0.5f);
        wc.weaponHolder = weaponHolder.transform;
        wc.cameraTransform = cameraObj.transform;

        GameObject[] models = new GameObject[6];

        // Fists - detailed with palms and fingers
        models[0] = CreateFistsModel(weaponHolder.transform);
        // Knife - blade, handle, guard
        models[1] = CreateKnifeModel(weaponHolder.transform);
        // Pistol - multi-part
        models[2] = CreatePistolModel(weaponHolder.transform);
        // AK-47 - detailed
        models[3] = CreateAK47Model(weaponHolder.transform);
        // M4A1 - detailed
        models[4] = CreateM4A1Model(weaponHolder.transform);
        // Shotgun - detailed
        models[5] = CreateShotgunModel(weaponHolder.transform);

        wc.weaponModels = models;

        // Muzzle flash
        GameObject muzzleFlash = CreateSphere("MuzzleFlash", Vector3.zero, new Vector3(0.1f, 0.1f, 0.1f), Color.yellow, weaponHolder.transform);
        muzzleFlash.transform.localPosition = new Vector3(0f, 0f, 0.7f);
        muzzleFlash.GetComponent<Collider>().enabled = false;
        muzzleFlash.SetActive(false);
        muzzleFlash.AddComponent<MuzzleFlashEffect>();
        wc.muzzleFlash = muzzleFlash;
    }

    private static GameObject CreateFistsModel(Transform parent)
    {
        GameObject root = new GameObject("WM_Fists");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.2f);

        Color skinColor = new Color(0.8f, 0.65f, 0.5f);

        // Left palm
        GameObject lPalm = CreateBox("Fist_LPalm", Vector3.zero, new Vector3(0.1f, 0.12f, 0.14f), skinColor, root.transform);
        lPalm.transform.localPosition = new Vector3(-0.08f, 0f, 0f);
        Object.DestroyImmediate(lPalm.GetComponent<Collider>());

        // Right palm
        GameObject rPalm = CreateBox("Fist_RPalm", Vector3.zero, new Vector3(0.1f, 0.12f, 0.14f), skinColor, root.transform);
        rPalm.transform.localPosition = new Vector3(0.08f, 0f, 0f);
        Object.DestroyImmediate(rPalm.GetComponent<Collider>());

        // Left fingers (4)
        for (int f = 0; f < 4; f++)
        {
            GameObject finger = CreateBox("Fist_LFinger_" + f, Vector3.zero, new Vector3(0.02f, 0.03f, 0.08f), skinColor, root.transform);
            finger.transform.localPosition = new Vector3(-0.12f + f * 0.015f, -0.02f + f * 0.01f, 0.1f);
            Object.DestroyImmediate(finger.GetComponent<Collider>());
        }

        // Right fingers (4)
        for (int f = 0; f < 4; f++)
        {
            GameObject finger = CreateBox("Fist_RFinger_" + f, Vector3.zero, new Vector3(0.02f, 0.03f, 0.08f), skinColor, root.transform);
            finger.transform.localPosition = new Vector3(0.05f + f * 0.015f, -0.02f + f * 0.01f, 0.1f);
            Object.DestroyImmediate(finger.GetComponent<Collider>());
        }

        return root;
    }

    private static GameObject CreateKnifeModel(Transform parent)
    {
        GameObject root = new GameObject("WM_Knife");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.2f);

        Color bladeColor = new Color(0.7f, 0.72f, 0.75f);
        Color handleColor = new Color(0.25f, 0.15f, 0.1f);
        Color guardColor = new Color(0.4f, 0.4f, 0.35f);

        // Blade
        GameObject blade = CreateBox("Knife_Blade", Vector3.zero, new Vector3(0.02f, 0.03f, 0.25f), bladeColor, root.transform);
        blade.transform.localPosition = new Vector3(0f, 0f, 0.15f);
        Object.DestroyImmediate(blade.GetComponent<Collider>());

        // Handle
        GameObject handle = CreateBox("Knife_Handle", Vector3.zero, new Vector3(0.03f, 0.04f, 0.12f), handleColor, root.transform);
        handle.transform.localPosition = new Vector3(0f, 0f, -0.04f);
        Object.DestroyImmediate(handle.GetComponent<Collider>());

        // Guard
        GameObject guard = CreateBox("Knife_Guard", Vector3.zero, new Vector3(0.06f, 0.05f, 0.015f), guardColor, root.transform);
        guard.transform.localPosition = new Vector3(0f, 0f, 0.02f);
        Object.DestroyImmediate(guard.GetComponent<Collider>());

        // Pommel
        GameObject pommel = CreateBox("Knife_Pommel", Vector3.zero, new Vector3(0.035f, 0.045f, 0.02f), guardColor, root.transform);
        pommel.transform.localPosition = new Vector3(0f, 0f, -0.1f);
        Object.DestroyImmediate(pommel.GetComponent<Collider>());

        // Blade edge (slightly lighter thin strip)
        GameObject edge = CreateBox("Knife_Edge", Vector3.zero, new Vector3(0.005f, 0.025f, 0.24f), new Color(0.85f, 0.85f, 0.88f), root.transform);
        edge.transform.localPosition = new Vector3(-0.012f, 0f, 0.15f);
        Object.DestroyImmediate(edge.GetComponent<Collider>());

        return root;
    }

    private static GameObject CreatePistolModel(Transform parent)
    {
        GameObject root = new GameObject("WM_Pistol");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.3f);

        Color slideColor = new Color(0.2f, 0.2f, 0.22f);
        Color frameColor = new Color(0.25f, 0.25f, 0.28f);
        Color gripColor = new Color(0.15f, 0.15f, 0.18f);

        // Slide (top)
        GameObject slide = CreateBox("Pistol_Slide", Vector3.zero, new Vector3(0.035f, 0.035f, 0.18f), slideColor, root.transform);
        slide.transform.localPosition = new Vector3(0f, 0.025f, 0f);
        Object.DestroyImmediate(slide.GetComponent<Collider>());

        // Frame (lower)
        GameObject frame = CreateBox("Pistol_Frame", Vector3.zero, new Vector3(0.03f, 0.03f, 0.15f), frameColor, root.transform);
        frame.transform.localPosition = new Vector3(0f, -0.005f, -0.01f);
        Object.DestroyImmediate(frame.GetComponent<Collider>());

        // Grip
        GameObject grip = CreateBox("Pistol_Grip", Vector3.zero, new Vector3(0.03f, 0.08f, 0.035f), gripColor, root.transform);
        grip.transform.localPosition = new Vector3(0f, -0.055f, -0.06f);
        Object.DestroyImmediate(grip.GetComponent<Collider>());

        // Trigger guard
        GameObject trigGuard = CreateBox("Pistol_TrigGuard", Vector3.zero, new Vector3(0.025f, 0.015f, 0.04f), frameColor, root.transform);
        trigGuard.transform.localPosition = new Vector3(0f, -0.03f, -0.02f);
        Object.DestroyImmediate(trigGuard.GetComponent<Collider>());

        // Barrel
        GameObject barrel = CreateCylinder("Pistol_Barrel", Vector3.zero, new Vector3(0.015f, 0.04f, 0.015f), slideColor, root.transform);
        barrel.transform.localPosition = new Vector3(0f, 0.02f, 0.1f);
        barrel.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(barrel.GetComponent<Collider>());

        // Front sight
        GameObject fSight = CreateBox("Pistol_FrontSight", Vector3.zero, new Vector3(0.008f, 0.012f, 0.008f), new Color(0.1f, 0.1f, 0.1f), root.transform);
        fSight.transform.localPosition = new Vector3(0f, 0.05f, 0.07f);
        Object.DestroyImmediate(fSight.GetComponent<Collider>());

        // Rear sight
        GameObject rSight = CreateBox("Pistol_RearSight", Vector3.zero, new Vector3(0.02f, 0.012f, 0.008f), new Color(0.1f, 0.1f, 0.1f), root.transform);
        rSight.transform.localPosition = new Vector3(0f, 0.05f, -0.05f);
        Object.DestroyImmediate(rSight.GetComponent<Collider>());

        // Magazine base
        GameObject magBase = CreateBox("Pistol_MagBase", Vector3.zero, new Vector3(0.025f, 0.01f, 0.03f), new Color(0.12f, 0.12f, 0.12f), root.transform);
        magBase.transform.localPosition = new Vector3(0f, -0.09f, -0.06f);
        Object.DestroyImmediate(magBase.GetComponent<Collider>());

        // Ejection port
        GameObject ejPort = CreateBox("Pistol_EjPort", Vector3.zero, new Vector3(0.01f, 0.01f, 0.04f), new Color(0.1f, 0.1f, 0.1f), root.transform);
        ejPort.transform.localPosition = new Vector3(0.018f, 0.03f, 0.02f);
        Object.DestroyImmediate(ejPort.GetComponent<Collider>());

        return root;
    }

    private static GameObject CreateAK47Model(Transform parent)
    {
        GameObject root = new GameObject("WM_AK47");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.4f);

        Color woodColor = new Color(0.35f, 0.25f, 0.15f);
        Color metalColor = new Color(0.2f, 0.2f, 0.22f);
        Color darkMetal = new Color(0.15f, 0.15f, 0.17f);

        // Receiver body
        GameObject receiver = CreateBox("AK_Receiver", Vector3.zero, new Vector3(0.04f, 0.05f, 0.25f), metalColor, root.transform);
        receiver.transform.localPosition = new Vector3(0f, 0f, 0f);
        Object.DestroyImmediate(receiver.GetComponent<Collider>());

        // Barrel
        GameObject barrel = CreateCylinder("AK_Barrel", Vector3.zero, new Vector3(0.018f, 0.15f, 0.018f), darkMetal, root.transform);
        barrel.transform.localPosition = new Vector3(0f, 0.01f, 0.27f);
        barrel.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(barrel.GetComponent<Collider>());

        // Stock
        GameObject stock = CreateBox("AK_Stock", Vector3.zero, new Vector3(0.035f, 0.05f, 0.2f), woodColor, root.transform);
        stock.transform.localPosition = new Vector3(0f, -0.01f, -0.22f);
        Object.DestroyImmediate(stock.GetComponent<Collider>());

        // Pistol grip
        GameObject grip = CreateBox("AK_Grip", Vector3.zero, new Vector3(0.03f, 0.07f, 0.03f), woodColor, root.transform);
        grip.transform.localPosition = new Vector3(0f, -0.055f, -0.05f);
        Object.DestroyImmediate(grip.GetComponent<Collider>());

        // Magazine (curved)
        GameObject mag = CreateBox("AK_Magazine", Vector3.zero, new Vector3(0.025f, 0.1f, 0.035f), darkMetal, root.transform);
        mag.transform.localPosition = new Vector3(0f, -0.07f, 0.02f);
        mag.transform.localRotation = Quaternion.Euler(10f, 0f, 0f);
        Object.DestroyImmediate(mag.GetComponent<Collider>());

        // Front sight
        GameObject fSight = CreateBox("AK_FrontSight", Vector3.zero, new Vector3(0.008f, 0.02f, 0.008f), darkMetal, root.transform);
        fSight.transform.localPosition = new Vector3(0f, 0.04f, 0.2f);
        Object.DestroyImmediate(fSight.GetComponent<Collider>());

        // Rear sight
        GameObject rSight = CreateBox("AK_RearSight", Vector3.zero, new Vector3(0.02f, 0.015f, 0.01f), darkMetal, root.transform);
        rSight.transform.localPosition = new Vector3(0f, 0.04f, -0.05f);
        Object.DestroyImmediate(rSight.GetComponent<Collider>());

        // Handguard
        GameObject handguard = CreateCylinder("AK_Handguard", Vector3.zero, new Vector3(0.035f, 0.07f, 0.035f), woodColor, root.transform);
        handguard.transform.localPosition = new Vector3(0f, -0.005f, 0.15f);
        handguard.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(handguard.GetComponent<Collider>());

        // Gas tube
        GameObject gasTube = CreateCylinder("AK_GasTube", Vector3.zero, new Vector3(0.012f, 0.08f, 0.012f), darkMetal, root.transform);
        gasTube.transform.localPosition = new Vector3(0f, 0.025f, 0.15f);
        gasTube.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(gasTube.GetComponent<Collider>());

        // Dust cover
        GameObject dustCover = CreateBox("AK_DustCover", Vector3.zero, new Vector3(0.035f, 0.01f, 0.15f), metalColor, root.transform);
        dustCover.transform.localPosition = new Vector3(0f, 0.03f, 0.02f);
        Object.DestroyImmediate(dustCover.GetComponent<Collider>());

        // Muzzle brake
        GameObject muzzle = CreateCylinder("AK_Muzzle", Vector3.zero, new Vector3(0.022f, 0.02f, 0.022f), darkMetal, root.transform);
        muzzle.transform.localPosition = new Vector3(0f, 0.01f, 0.42f);
        muzzle.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(muzzle.GetComponent<Collider>());

        // Trigger guard
        GameObject trigGuard = CreateBox("AK_TrigGuard", Vector3.zero, new Vector3(0.02f, 0.01f, 0.04f), darkMetal, root.transform);
        trigGuard.transform.localPosition = new Vector3(0f, -0.035f, -0.02f);
        Object.DestroyImmediate(trigGuard.GetComponent<Collider>());

        return root;
    }

    private static GameObject CreateM4A1Model(Transform parent)
    {
        GameObject root = new GameObject("WM_M4A1");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.4f);

        Color gunMetal = new Color(0.25f, 0.25f, 0.28f);
        Color darkGray = new Color(0.15f, 0.15f, 0.17f);
        Color railColor = new Color(0.2f, 0.2f, 0.2f);

        // Receiver
        GameObject receiver = CreateBox("M4_Receiver", Vector3.zero, new Vector3(0.04f, 0.05f, 0.2f), gunMetal, root.transform);
        receiver.transform.localPosition = new Vector3(0f, 0f, 0f);
        Object.DestroyImmediate(receiver.GetComponent<Collider>());

        // Barrel
        GameObject barrel = CreateCylinder("M4_Barrel", Vector3.zero, new Vector3(0.015f, 0.14f, 0.015f), darkGray, root.transform);
        barrel.transform.localPosition = new Vector3(0f, 0.005f, 0.24f);
        barrel.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(barrel.GetComponent<Collider>());

        // Stock (collapsible)
        GameObject stock = CreateBox("M4_Stock", Vector3.zero, new Vector3(0.03f, 0.04f, 0.15f), gunMetal, root.transform);
        stock.transform.localPosition = new Vector3(0f, 0f, -0.17f);
        Object.DestroyImmediate(stock.GetComponent<Collider>());

        // Buffer tube
        GameObject bufferTube = CreateCylinder("M4_BufferTube", Vector3.zero, new Vector3(0.02f, 0.08f, 0.02f), darkGray, root.transform);
        bufferTube.transform.localPosition = new Vector3(0f, 0f, -0.12f);
        bufferTube.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(bufferTube.GetComponent<Collider>());

        // Grip
        GameObject grip = CreateBox("M4_Grip", Vector3.zero, new Vector3(0.025f, 0.065f, 0.03f), darkGray, root.transform);
        grip.transform.localPosition = new Vector3(0f, -0.05f, -0.04f);
        Object.DestroyImmediate(grip.GetComponent<Collider>());

        // Magazine
        GameObject mag = CreateBox("M4_Magazine", Vector3.zero, new Vector3(0.02f, 0.08f, 0.03f), darkGray, root.transform);
        mag.transform.localPosition = new Vector3(0f, -0.06f, 0.03f);
        Object.DestroyImmediate(mag.GetComponent<Collider>());

        // Rail system on top
        GameObject rail = CreateBox("M4_Rail", Vector3.zero, new Vector3(0.025f, 0.008f, 0.18f), railColor, root.transform);
        rail.transform.localPosition = new Vector3(0f, 0.03f, 0.05f);
        Object.DestroyImmediate(rail.GetComponent<Collider>());

        // Front sight
        GameObject fSight = CreateBox("M4_FrontSight", Vector3.zero, new Vector3(0.008f, 0.025f, 0.008f), darkGray, root.transform);
        fSight.transform.localPosition = new Vector3(0f, 0.045f, 0.18f);
        Object.DestroyImmediate(fSight.GetComponent<Collider>());

        // Rear sight
        GameObject rSight = CreateBox("M4_RearSight", Vector3.zero, new Vector3(0.02f, 0.02f, 0.01f), darkGray, root.transform);
        rSight.transform.localPosition = new Vector3(0f, 0.045f, -0.04f);
        Object.DestroyImmediate(rSight.GetComponent<Collider>());

        // Handguard (box around barrel)
        GameObject handguard = CreateBox("M4_Handguard", Vector3.zero, new Vector3(0.04f, 0.04f, 0.14f), gunMetal, root.transform);
        handguard.transform.localPosition = new Vector3(0f, -0.005f, 0.16f);
        Object.DestroyImmediate(handguard.GetComponent<Collider>());

        // Flash hider
        GameObject flashHider = CreateCylinder("M4_FlashHider", Vector3.zero, new Vector3(0.018f, 0.02f, 0.018f), darkGray, root.transform);
        flashHider.transform.localPosition = new Vector3(0f, 0.005f, 0.38f);
        flashHider.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(flashHider.GetComponent<Collider>());

        return root;
    }

    private static GameObject CreateShotgunModel(Transform parent)
    {
        GameObject root = new GameObject("WM_Shotgun");
        root.transform.SetParent(parent);
        root.transform.localPosition = new Vector3(0f, 0f, 0.4f);

        Color metalColor = new Color(0.2f, 0.2f, 0.22f);
        Color woodColor = new Color(0.4f, 0.3f, 0.2f);
        Color darkMetal = new Color(0.12f, 0.12f, 0.14f);

        // Barrel (long)
        GameObject barrel = CreateCylinder("SG_Barrel", Vector3.zero, new Vector3(0.022f, 0.2f, 0.022f), metalColor, root.transform);
        barrel.transform.localPosition = new Vector3(0f, 0.015f, 0.15f);
        barrel.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(barrel.GetComponent<Collider>());

        // Magazine tube under barrel
        GameObject magTube = CreateCylinder("SG_MagTube", Vector3.zero, new Vector3(0.018f, 0.15f, 0.018f), darkMetal, root.transform);
        magTube.transform.localPosition = new Vector3(0f, -0.01f, 0.12f);
        magTube.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        Object.DestroyImmediate(magTube.GetComponent<Collider>());

        // Pump (forend)
        GameObject pump = CreateBox("SG_Pump", Vector3.zero, new Vector3(0.04f, 0.04f, 0.1f), woodColor, root.transform);
        pump.transform.localPosition = new Vector3(0f, -0.005f, 0.1f);
        Object.DestroyImmediate(pump.GetComponent<Collider>());

        // Receiver body
        GameObject receiver = CreateBox("SG_Receiver", Vector3.zero, new Vector3(0.04f, 0.05f, 0.15f), metalColor, root.transform);
        receiver.transform.localPosition = new Vector3(0f, 0f, -0.03f);
        Object.DestroyImmediate(receiver.GetComponent<Collider>());

        // Stock
        GameObject stock = CreateBox("SG_Stock", Vector3.zero, new Vector3(0.035f, 0.05f, 0.18f), woodColor, root.transform);
        stock.transform.localPosition = new Vector3(0f, -0.01f, -0.2f);
        Object.DestroyImmediate(stock.GetComponent<Collider>());

        // Grip
        GameObject grip = CreateBox("SG_Grip", Vector3.zero, new Vector3(0.03f, 0.06f, 0.03f), woodColor, root.transform);
        grip.transform.localPosition = new Vector3(0f, -0.05f, -0.05f);
        Object.DestroyImmediate(grip.GetComponent<Collider>());

        // Trigger guard
        GameObject trigGuard = CreateBox("SG_TrigGuard", Vector3.zero, new Vector3(0.02f, 0.01f, 0.04f), darkMetal, root.transform);
        trigGuard.transform.localPosition = new Vector3(0f, -0.035f, -0.03f);
        Object.DestroyImmediate(trigGuard.GetComponent<Collider>());

        // Shell port (ejection)
        GameObject shellPort = CreateBox("SG_ShellPort", Vector3.zero, new Vector3(0.015f, 0.02f, 0.04f), new Color(0.1f, 0.1f, 0.1f), root.transform);
        shellPort.transform.localPosition = new Vector3(0.022f, 0.01f, -0.01f);
        Object.DestroyImmediate(shellPort.GetComponent<Collider>());

        // Front bead sight
        GameObject bead = CreateSphere("SG_FrontBead", Vector3.zero, new Vector3(0.012f, 0.012f, 0.012f), new Color(0.9f, 0.9f, 0.9f), root.transform);
        bead.transform.localPosition = new Vector3(0f, 0.035f, 0.3f);
        Object.DestroyImmediate(bead.GetComponent<Collider>());

        // Buttpad
        GameObject buttpad = CreateBox("SG_Buttpad", Vector3.zero, new Vector3(0.038f, 0.055f, 0.015f), new Color(0.1f, 0.1f, 0.1f), root.transform);
        buttpad.transform.localPosition = new Vector3(0f, -0.01f, -0.29f);
        Object.DestroyImmediate(buttpad.GetComponent<Collider>());

        return root;
    }

    private static void CreateBots()
    {
        GameObject botsRoot = new GameObject("Bots");

        Vector3[] guardWaypoints = new Vector3[]
        {
            new Vector3(0f, 1f, -15f),
            new Vector3(0f, 1f, -5f),
            new Vector3(0f, 1f, 5f),
            new Vector3(0f, 1f, 15f),
            new Vector3(0f, 1f, 5f),
            new Vector3(0f, 1f, -5f)
        };

        Vector3[] yardWaypoints = new Vector3[]
        {
            new Vector3(-5f, 1f, 30f),
            new Vector3(5f, 1f, 30f),
            new Vector3(5f, 1f, 40f),
            new Vector3(-5f, 1f, 40f)
        };

        Vector3[] prisonerWaypoints = new Vector3[]
        {
            new Vector3(4f, 1f, -15f),
            new Vector3(4f, 1f, -10f),
            new Vector3(4f, 1f, -5f),
            new Vector3(4f, 1f, 0f),
            new Vector3(4f, 1f, -5f),
            new Vector3(4f, 1f, -10f)
        };

        BotSpawner.SpawnBot(new Vector3(-10f, 1f, -12f), Team.Guard, guardWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(-10f, 1f, -10f), Team.Guard, guardWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(0f, 1f, 30f), Team.Guard, yardWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(2f, 1f, 32f), Team.Guard, yardWaypoints).transform.SetParent(botsRoot.transform);

        BotSpawner.SpawnBot(new Vector3(4f, 1f, -15f), Team.Prisoner, prisonerWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(4f, 1f, -10f), Team.Prisoner, prisonerWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(4f, 1f, -5f), Team.Prisoner, prisonerWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(4f, 1f, 5f), Team.Prisoner, prisonerWaypoints).transform.SetParent(botsRoot.transform);
        BotSpawner.SpawnBot(new Vector3(4f, 1f, 10f), Team.Prisoner, prisonerWaypoints).transform.SetParent(botsRoot.transform);
    }

    private static void CreateManagers()
    {
        GameObject managers = new GameObject("Managers");

        GameObject gmObj = new GameObject("GameManager");
        gmObj.transform.SetParent(managers.transform);
        gmObj.AddComponent<GameManager>();

        GameObject tmObj = new GameObject("TeamManager");
        tmObj.transform.SetParent(managers.transform);
        tmObj.AddComponent<TeamManager>();

        GameObject rmObj = new GameObject("RoundManager");
        rmObj.transform.SetParent(managers.transform);
        rmObj.AddComponent<RoundManager>();

        GameObject specObj = new GameObject("SpectateCamera");
        specObj.transform.SetParent(managers.transform);
        specObj.AddComponent<SpectateCamera>();
    }

    private static void CreateUI()
    {
        GameObject uiRoot = new GameObject("UI");

        GameObject gameUI = new GameObject("GameUI");
        gameUI.transform.SetParent(uiRoot.transform);
        gameUI.AddComponent<GameUI>();

        GameObject teamUI = new GameObject("TeamSelectUI");
        teamUI.transform.SetParent(uiRoot.transform);
        teamUI.AddComponent<TeamSelectUI>();

        GameObject killFeed = new GameObject("KillFeed");
        killFeed.transform.SetParent(uiRoot.transform);
        killFeed.AddComponent<KillFeed>();
    }
}
