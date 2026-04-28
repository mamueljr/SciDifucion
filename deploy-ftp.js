import * as ftp from "basic-ftp";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
        console.log("-----------------------------------------");
        console.log("🚀 Iniciando despliegue a Hostinger...");
        console.log("Conectando al servidor FTP...");
        
        await client.access({
            host: process.env.FTP_SERVER,
            user: process.env.FTP_USERNAME,
            password: process.env.FTP_PASSWORD,
            secure: false // Cambiar a true si Hostinger requiere FTPS explícito
        });
        
        console.log("✅ Conexión exitosa. Subiendo archivos de la carpeta 'dist'...");
        
        const localDir = path.join(__dirname, 'dist');
        // El usuario FTP ya entra directo a la carpeta principal
        const remoteDir = "/scidifucion"; 
        
        // Sube todo el contenido de dist/ a public_html/
        await client.uploadFromDir(localDir, remoteDir);
        
        console.log("-----------------------------------------");
        console.log("✅ ¡Despliegue completado con éxito!");
        console.log("-----------------------------------------");
    } catch(err) {
        console.log("-----------------------------------------");
        console.error("❌ Error durante el despliegue:");
        console.error(err);
        console.log("-----------------------------------------");
    } finally {
        client.close();
    }
}

deploy();
