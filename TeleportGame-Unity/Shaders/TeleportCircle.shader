Shader "Custom/TeleportCircle"
{
    Properties
    {
        _Color ("Цвет", Color) = (0.2, 0.6, 1.0, 0.5)
        _InnerRadius ("Внутренний радиус", Range(0, 1)) = 0.85
        _OuterRadius ("Внешний радиус", Range(0, 1)) = 1.0
        _PulseSpeed ("Скорость пульсации", Float) = 2.0
        _PulseAmplitude ("Амплитуда пульсации", Range(0, 0.2)) = 0.05
        _RingCount ("Количество колец", Float) = 3.0
        _RingSpeed ("Скорость колец", Float) = 1.0
        _EdgeSoftness ("Мягкость края", Range(0.001, 0.1)) = 0.02
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Transparent"
            "Queue" = "Transparent"
            "IgnoreProjector" = "True"
        }

        LOD 100
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                UNITY_FOG_COORDS(1)
            };

            fixed4 _Color;
            float _InnerRadius;
            float _OuterRadius;
            float _PulseSpeed;
            float _PulseAmplitude;
            float _RingCount;
            float _RingSpeed;
            float _EdgeSoftness;

            v2f vert(appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                UNITY_TRANSFER_FOG(o, o.vertex);
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                // Центрируем UV координаты
                float2 center = i.uv - 0.5;
                float dist = length(center) * 2.0;

                // Пульсация радиуса
                float pulse = sin(_Time.y * _PulseSpeed) * _PulseAmplitude;
                float innerR = _InnerRadius + pulse;
                float outerR = _OuterRadius + pulse;

                // Основное кольцо
                float ring = smoothstep(innerR - _EdgeSoftness, innerR, dist)
                           * (1.0 - smoothstep(outerR, outerR + _EdgeSoftness, dist));

                // Анимированные вторичные кольца
                float animatedDist = dist + _Time.y * _RingSpeed * 0.1;
                float rings = sin(animatedDist * _RingCount * 3.14159) * 0.5 + 0.5;
                rings *= smoothstep(0.0, innerR, dist) * (1.0 - smoothstep(outerR, 1.0, dist));

                // Комбинируем
                float alpha = max(ring, rings * 0.3);
                alpha *= _Color.a;

                // Отсекаем пиксели за пределами круга
                alpha *= (1.0 - smoothstep(outerR, outerR + _EdgeSoftness * 2.0, dist));

                fixed4 col = _Color;
                col.a = alpha;

                UNITY_APPLY_FOG(i.fogCoord, col);
                return col;
            }
            ENDCG
        }
    }

    FallBack "Transparent/Diffuse"
}
