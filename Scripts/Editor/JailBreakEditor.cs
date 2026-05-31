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

                CreateBox(cellName + "_BackWall", new Vector3(xOffset + (side == 0 ? 2.5f : -2.5f), 2.5f, zPos), new Vector3(0.3f, 5f, 5f), wallColor, ct);
                CreateBox(cellName + "_SideWallA", new Vector3(xOffset, 2.5f, zPos + 2.5f), new Vector3(5f, 5f, 0.3f), wallColor, ct);
                CreateBox(cellName + "_SideWallB", new Vector3(xOffset, 2.5f, zPos - 2.5f), new Vector3(5f, 5f, 0.3f), wallColor, ct);

                float bedX = xOffset + (side == 0 ? 1.5f : -1.5f);
                CreateBox(cellName + "_BedFrame", new Vector3(bedX, 0.4f, zPos - 1f), new Vector3(1.2f, 0.4f, 2f), bedColor, ct);
                CreateBox(cellName + "_Mattress", new Vector3(bedX, 0.65f, zPos - 1f), new Vector3(1f, 0.15f, 1.8f), mattressColor, ct);

                float toiletX = xOffset + (side == 0 ? 1.8f : -1.8f);
                CreateBox(cellName + "_ToiletBase", new Vector3(toiletX, 0.3f, zPos + 1.5f), new Vector3(0.5f, 0.6f, 0.5f), toiletColor, ct);
                CreateBox(cellName + "_ToiletTop", new Vector3(toiletX, 0.65f, zPos + 1.5f), new Vector3(0.5f, 0.1f, 0.6f), toiletColor, ct);

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

                BoxCollider doorCol = doorObj.AddComponent<BoxCollider>();
                doorCol.center = new Vector3(0f, 2.5f, 0f);
                doorCol.size = new Vector3(0.3f, 5f, 5f);
                DoorController dc = doorObj.AddComponent<DoorController>();
                dc.doorType = DoorType.CellDoor;
                dc.closedPosition = doorObj.transform.localPosition;
                dc.openPosition = doorObj.transform.localPosition + Vector3.up * 5f;

                CreateLight(cellName + "_Light", new Vector3(xOffset, 4.5f, zPos), new Color(1f, 0.9f, 0.7f), 6f, 1f, ct);
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
            CreateLight("CorridorLight_" + i, new Vector3(0f, 4.5f, z), new Color(1f, 0.95f, 0.8f), 8f, 1.2f, cr);
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

        CreateBox("GR_Desk", new Vector3(-13f, 0.8f, -12f), new Vector3(2f, 0.8f, 1.2f), deskColor, gr);
        CreateBox("GR_Monitor1", new Vector3(-13.5f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Monitor2", new Vector3(-12.5f, 1.4f, -12f), new Vector3(0.6f, 0.5f, 0.1f), monitorColor, gr);
        CreateBox("GR_Chair", new Vector3(-13f, 0.5f, -11f), new Vector3(0.6f, 0.5f, 0.6f), new Color(0.2f, 0.2f, 0.3f), gr);

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

        Color benchColor = new Color(0.4f, 0.3f, 0.2f);
        CreateBox("Yard_Bench1", new Vector3(-8f, 0.5f, 28f), new Vector3(3f, 0.5f, 0.6f), benchColor, yr);
        CreateBox("Yard_Bench2", new Vector3(8f, 0.5f, 28f), new Vector3(3f, 0.5f, 0.6f), benchColor, yr);
        CreateBox("Yard_Bench3", new Vector3(-8f, 0.5f, 42f), new Vector3(3f, 0.5f, 0.6f), benchColor, yr);
        CreateBox("Yard_Bench4", new Vector3(8f, 0.5f, 42f), new Vector3(3f, 0.5f, 0.6f), benchColor, yr);
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
        }

        CreateBox("CF_Counter", new Vector3(14f, 1f, 10f), new Vector3(1.5f, 1f, 6f), counterColor, cf);

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

        Color gunMetal = new Color(0.25f, 0.25f, 0.28f);
        Color knifeColor = new Color(0.6f, 0.6f, 0.65f);
        Color skinColor = new Color(0.8f, 0.65f, 0.5f);

        GameObject[] models = new GameObject[6];

        GameObject fists = CreateBox("WM_Fists", Vector3.zero, new Vector3(0.15f, 0.15f, 0.2f), skinColor, weaponHolder.transform);
        fists.transform.localPosition = new Vector3(0f, 0f, 0.2f);
        models[0] = fists;

        GameObject knife = CreateBox("WM_Knife", Vector3.zero, new Vector3(0.04f, 0.04f, 0.35f), knifeColor, weaponHolder.transform);
        knife.transform.localPosition = new Vector3(0f, 0f, 0.2f);
        models[1] = knife;

        GameObject pistol = CreateBox("WM_Pistol", Vector3.zero, new Vector3(0.06f, 0.12f, 0.22f), gunMetal, weaponHolder.transform);
        pistol.transform.localPosition = new Vector3(0f, 0f, 0.3f);
        models[2] = pistol;

        GameObject ak47 = CreateBox("WM_AK47", Vector3.zero, new Vector3(0.06f, 0.12f, 0.6f), new Color(0.35f, 0.25f, 0.15f), weaponHolder.transform);
        ak47.transform.localPosition = new Vector3(0f, 0f, 0.4f);
        models[3] = ak47;

        GameObject m4 = CreateBox("WM_M4A1", Vector3.zero, new Vector3(0.06f, 0.11f, 0.55f), gunMetal, weaponHolder.transform);
        m4.transform.localPosition = new Vector3(0f, 0f, 0.4f);
        models[4] = m4;

        GameObject shotgun = CreateBox("WM_Shotgun", Vector3.zero, new Vector3(0.07f, 0.1f, 0.65f), new Color(0.4f, 0.3f, 0.2f), weaponHolder.transform);
        shotgun.transform.localPosition = new Vector3(0f, 0f, 0.4f);
        models[5] = shotgun;

        wc.weaponModels = models;

        GameObject muzzleFlash = CreateSphere("MuzzleFlash", Vector3.zero, new Vector3(0.1f, 0.1f, 0.1f), Color.yellow, weaponHolder.transform);
        muzzleFlash.transform.localPosition = new Vector3(0f, 0f, 0.7f);
        muzzleFlash.GetComponent<Collider>().enabled = false;
        muzzleFlash.SetActive(false);
        wc.muzzleFlash = muzzleFlash;
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
