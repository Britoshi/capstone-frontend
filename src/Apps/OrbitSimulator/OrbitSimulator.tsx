export default function OrbitSimulator()
{
    return (
        <div style={{ width: "100%", height: "100vh", background: "#000" }}>
            <iframe
                src="/OrbitalSimulator/index.html"
                title="Unity WebGL"
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
                allowFullScreen
            />
        </div>
    );
}