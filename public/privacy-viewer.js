// privacy-viewer.js
class PrivacyViewer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.loadPrivacyContent();
    }

    render() {
        this.innerHTML = `
            <style>
                .privacy-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: white;
                    z-index: 2000;
                    overflow-y: auto;
                }
                .privacy-header {
                    background: #43938A;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .privacy-header h1 {
                    margin: 0;
                    font-size: 1.2em;
                    flex: 1;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5em;
                    cursor: pointer;
                    padding: 5px 15px;
                }
                .privacy-content {
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                    line-height: 1.6;
                    color: #333;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .error {
                    background: #ffeaea;
                    color: #d00;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .privacy-content h1 { 
                    color: #2c3e50; 
                    border-bottom: 2px solid #43938A; 
                    padding-bottom: 10px; 
                    margin-top: 0;
                }
                .privacy-content h2 { 
                    color: #34495e; 
                    margin-top: 30px; 
                }
                .privacy-content h3 { 
                    color: #7f8c8d; 
                }
                .privacy-content code { 
                    background: #f8f9fa; 
                    padding: 2px 6px; 
                    border-radius: 3px; 
                    font-family: 'Courier New', monospace;
                }
                .privacy-content pre { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    overflow-x: auto;
                    border-left: 4px solid #43938A;
                }
                .privacy-content blockquote {
                    border-left: 4px solid #43938A;
                    padding-left: 15px;
                    margin-left: 0;
                    color: #7f8c8d;
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-radius: 0 5px 5px 0;
                }
                .privacy-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 20px 0;
                }
                .privacy-content th, .privacy-content td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                .privacy-content th {
                    background: #f8f9fa;
                }
                .privacy-content ul, .privacy-content ol {
                    padding-left: 20px;
                }
                .privacy-content li {
                    margin: 8px 0;
                }
                .privacy-content a {
                    color: #43938A;
                    text-decoration: none;
                }
                .privacy-content a:hover {
                    text-decoration: underline;
                }
            </style>
            <div class="privacy-container">
                <div class="privacy-header">
                    <button class="close-btn" id="closeBtn">×</button>
                    <h1>Politique de Confidentialité</h1>
                </div>
                <div class="privacy-content" id="content">
                    <div class="loading">Chargement de la politique de confidentialité...</div>
                </div>
            </div>
        `;

        this.querySelector('#closeBtn').addEventListener('click', () => {
            this.remove();
        });

        // Fermer avec la touche Échap
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.remove();
        });
    }

    async loadPrivacyContent() {
        try {
            const response = await fetch('PRIVACY.md');
            if (!response.ok) throw new Error('Fichier non trouvé');

            const markdown = await response.text();
            this.querySelector('#content').innerHTML = this.convertMarkdownToHtml(markdown);
        } catch (error) {
            this.querySelector('#content').innerHTML = `
                <div class="error">
                    <h3>Erreur de chargement</h3>
                    <p>Impossible de charger la politique de confidentialité.</p>
                    <p>Vérifiez que le fichier PRIVACY.md existe à la racine de l'application.</p>
                </div>
            `;
        }
    }

    convertMarkdownToHtml(markdown) {
        return markdown
            // Titres
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            // Gras
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Italique
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Code inline
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            // Blocs de code
            .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
            // Listes non ordonnées
            .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // Listes ordonnées
            .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
            // Liens
            .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
            // Lignes horizontales
            .replace(/^\-\-\-$/gim, '<hr>')
            // Citations
            .replace(/^\>\s(.*$)/gim, '<blockquote>$1</blockquote>')
            // Paragraphes
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>')
            // Nettoyage final
            .replace(/<p><\/p>/gim, '')
            .replace(/<p>(<h[1-6]>)/gim, '$1')
            .replace(/(<\/h[1-6]>)<\/p>/gim, '$1')
            .replace(/<p>(<ul>|<ol>)/gim, '$1')
            .replace(/(<\/ul>|<\/ol>)<\/p>/gim, '$1')
            .replace(/<p>(<li>)/gim, '$1')
            .replace(/(<\/li>)<\/p>/gim, '$1');
    }
}

customElements.define('privacy-viewer', PrivacyViewer);