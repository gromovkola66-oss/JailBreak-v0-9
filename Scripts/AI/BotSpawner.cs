using UnityEngine;

public static class BotSpawner
{
    public static GameObject SpawnBot(Vector3 position, Team team, Vector3[] waypoints)
    {
        GameObject bot = new GameObject(team.ToString() + "Bot_" + Random.Range(1000, 9999));
        bot.transform.position = position;

        CharacterController cc = bot.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.4f;
        cc.center = new Vector3(0f, 1f, 0f);

        // Add hit detection collider
        BoxCollider hitBox = bot.AddComponent<BoxCollider>();
        hitBox.center = new Vector3(0f, 1f, 0f);
        hitBox.size = new Vector3(0.5f, 2f, 0.5f);

        BotController bc = bot.AddComponent<BotController>();
        bc.team = team;
        bc.waypoints = waypoints;

        BotHealth bh = bot.AddComponent<BotHealth>();

        DamageReceiver dr = bot.AddComponent<DamageReceiver>();
        dr.team = team;

        // Determine team colors
        Color bodyColor;
        Color darkColor;
        if (team == Team.Guard)
        {
            bodyColor = new Color(0.2f, 0.4f, 0.8f);
            darkColor = new Color(0.1f, 0.2f, 0.5f);
        }
        else
        {
            bodyColor = new Color(0.9f, 0.5f, 0.1f);
            darkColor = new Color(0.6f, 0.3f, 0.05f);
        }

        // Torso
        GameObject torso = CreateBotPart("Torso", bot.transform, Vector3.zero, new Vector3(0.5f, 0.6f, 0.3f), PrimitiveType.Cube, bodyColor);
        torso.transform.localPosition = new Vector3(0f, 1.0f, 0f);

        // Head
        GameObject head = CreateBotPart("Head", bot.transform, Vector3.zero, new Vector3(0.35f, 0.35f, 0.35f), PrimitiveType.Sphere, bodyColor);
        head.transform.localPosition = new Vector3(0f, 1.65f, 0f);

        // Left Arm
        GameObject leftArm = CreateBotPart("LeftArm", bot.transform, Vector3.zero, new Vector3(0.12f, 0.3f, 0.12f), PrimitiveType.Cylinder, bodyColor);
        leftArm.transform.localPosition = new Vector3(-0.38f, 1.0f, 0f);

        // Right Arm
        GameObject rightArm = CreateBotPart("RightArm", bot.transform, Vector3.zero, new Vector3(0.12f, 0.3f, 0.12f), PrimitiveType.Cylinder, bodyColor);
        rightArm.transform.localPosition = new Vector3(0.38f, 1.0f, 0f);

        // Left Leg
        GameObject leftLeg = CreateBotPart("LeftLeg", bot.transform, Vector3.zero, new Vector3(0.14f, 0.4f, 0.14f), PrimitiveType.Cylinder, darkColor);
        leftLeg.transform.localPosition = new Vector3(-0.15f, 0.4f, 0f);

        // Right Leg
        GameObject rightLeg = CreateBotPart("RightLeg", bot.transform, Vector3.zero, new Vector3(0.14f, 0.4f, 0.14f), PrimitiveType.Cylinder, darkColor);
        rightLeg.transform.localPosition = new Vector3(0.15f, 0.4f, 0f);

        // Eyes
        Color eyeColor = new Color(0.05f, 0.05f, 0.05f);
        GameObject leftEye = CreateBotPart("LeftEye", bot.transform, Vector3.zero, new Vector3(0.06f, 0.06f, 0.06f), PrimitiveType.Sphere, eyeColor);
        leftEye.transform.localPosition = new Vector3(-0.08f, 1.68f, 0.15f);

        GameObject rightEye = CreateBotPart("RightEye", bot.transform, Vector3.zero, new Vector3(0.06f, 0.06f, 0.06f), PrimitiveType.Sphere, eyeColor);
        rightEye.transform.localPosition = new Vector3(0.08f, 1.68f, 0.15f);

        // Guard cap
        if (team == Team.Guard)
        {
            Color capColor = new Color(0.1f, 0.1f, 0.3f);
            GameObject cap = CreateBotPart("Cap", bot.transform, Vector3.zero, new Vector3(0.25f, 0.05f, 0.25f), PrimitiveType.Cylinder, capColor);
            cap.transform.localPosition = new Vector3(0f, 1.85f, 0f);
        }

        if (TeamManager.Instance != null)
        {
            TeamManager.Instance.AssignTeam(bot, team);
        }

        return bot;
    }

    private static GameObject CreateBotPart(string name, Transform parent, Vector3 pos, Vector3 scale, PrimitiveType type, Color color)
    {
        GameObject part = GameObject.CreatePrimitive(type);
        part.name = name;
        part.transform.SetParent(parent);
        part.transform.localPosition = pos;
        part.transform.localScale = scale;

        // Remove collider from visual part
        Collider col = part.GetComponent<Collider>();
        if (col != null) Object.Destroy(col);

        // Apply material
        Renderer rend = part.GetComponent<Renderer>();
        if (rend != null)
        {
            Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            mat.color = color;
            rend.material = mat;
        }

        return part;
    }
}
