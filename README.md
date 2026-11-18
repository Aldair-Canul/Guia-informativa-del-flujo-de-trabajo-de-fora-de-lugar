<div align="center">

# fora/commit

**Guía en español para hacer juegos con Godot y no perder nada en el camino.**
Aprende Godot, Git y GitHub desde cero, con ejemplos de nuestro proyecto real: *Fora de Lugar*.

[![Ver el sitio](https://img.shields.io/badge/ver_el_sitio-ff5a1f?style=for-the-badge&logo=githubpages&logoColor=black)](https://aldair-canul.github.io/Guia-informativa-del-flujo-de-trabajo-de-fora-de-lugar/)
[![Nuestro juego](https://img.shields.io/badge/repo_del_juego-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aldair-Canul/Facultad-de-Ingenieria---Fora-de-Lugar)

![Godot](https://img.shields.io/badge/Godot_4.6-478CBF?style=flat-square&logo=godotengine&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-000000?style=flat-square&logo=html5&logoColor=ff5a1f)
![CSS3](https://img.shields.io/badge/CSS3-000000?style=flat-square&logo=css3&logoColor=ff5a1f)
![JavaScript](https://img.shields.io/badge/JavaScript-000000?style=flat-square&logo=javascript&logoColor=ff5a1f)
![Sin dependencias](https://img.shields.io/badge/dependencias-0-8fb89a?style=flat-square)

</div>

---

## De qué trata

Un sitio web que explica, paso a paso, cómo crear videojuegos con **Godot** y llevar el control de versiones con **Git** y **GitHub**. Está pensado para quien nunca ha abierto un motor de juegos ni escrito un `git commit`.

Al final muestra cómo lo usamos nosotros en **Fora de Lugar**, un juego hecho en Godot 4.6 para la Facultad de Ingeniería, con datos tomados del historial real del repositorio.

## Qué encontrarás

| Sección | Qué hay |
|---|---|
| **Las tres piezas** | Qué hace Godot, qué hace Git y qué hace GitHub, y cómo se conectan. |
| **Seis pasos para arrancar** | De instalar las herramientas al primer commit. |
| **Comandos de Git** | 27 comandos con buscador y filtros. Un clic copia el comando. |
| **Simulador de ramas** | Haz commits, crea ramas y fusiona viendo el grafo en vivo. |
| **Godot y Git juntos** | `.gitignore` y `.gitattributes` recomendados para Godot 4 y hábitos que evitan conflictos. |
| **Publicar en GitHub** | Del repo local a la nube, con autenticación incluida. |
| **Así lo hacemos en Fora de Lugar** | Nuestro flujo real: ramas, commits con gitmoji y Pull Requests, más lo que haríamos distinto. |
| **Checklist y preguntas frecuentes** | Tu progreso se guarda en el navegador. |

## Nuestro flujo, en corto

```text
main  ──●────────●──────────●──▶   siempre es lo que funciona
         \      /            /
          ●──●──●   fix/cuarto   una rama por tarea
                    ↳ Pull Request → merge
```

- Ramas con prefijo: `feat/`, `fix/`, `opt/`, `update/`.
- Commits con gitmoji: `:bug: fix: ...`, `:hammer: feat: ...`.
- Todo entra a `main` por Pull Request.

Los detalles, con el ejemplo completo, están en la sección *Así lo hacemos en Fora de Lugar* del sitio.

## Estructura del repositorio

```text
.
├── index.html   contenido y estructura
├── style.css    tema negro con un solo acento (#ff5a1f)
├── script.js    terminal animada, buscador, simulador de ramas y checklist
└── README.md
```

HTML, CSS y JavaScript puros. Sin frameworks, sin build, sin dependencias.

## Enlaces útiles

- [Documentación de Godot](https://docs.godotengine.org/es/stable/)
- [Libro Pro Git](https://git-scm.com/book/es/v2)
- [Documentación de GitHub](https://docs.github.com/es)
- [Repositorio de Fora de Lugar](https://github.com/Aldair-Canul/Facultad-de-Ingenieria---Fora-de-Lugar)

---

<div align="center">

© 2026 Equipo Fora de Lugar · Facultad de Ingeniería. Todos los derechos reservados.

</div>
