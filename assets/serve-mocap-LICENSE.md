# Tennis serve motion attribution

`serve-mocap.json` is an adapted, cropped and resampled motion from
`data/jgacosta_Servicio.bvh` in **Tennis-MoCap**, by Juan Diego Pulgarin-Giraldo
and the Tennis-MoCap contributors.

Source: https://github.com/jdpulgarin/Tennis-MoCap

Original copyright and license: https://github.com/jdpulgarin/Tennis-MoCap/blob/main/Copyright.md

The original motion and this adapted motion are licensed under **Creative Commons
Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)**:
https://creativecommons.org/licenses/by-sa/3.0/

Changes: selected the first complete serve (0.20–2.90 seconds), removed world
horizontal placement, aligned the initial lateral hip direction to the X axis,
converted centimeters to meters, sampled joint positions at 60 Hz, and rounded
positions to five decimal places. The motion is retargeted to a different mesh
at runtime. No player likeness is used.

Dataset authors: Juan Diego Pulgarin-Giraldo, Sergio Garcia-Vega, Luis Gerardo
Melo-Betancourt, Santiago Ramos-Bermudez, Andres Marino Alvarez-Meza, and German
Castellanos.

Related publication: Pulgarin-Giraldo J.D. et al., *A Similarity Indicator for
Differentiating Kinematic Performance Between Qualified Tennis Players*,
LNCS 10125, pp. 309–317, 2017. https://doi.org/10.1007/978-3-319-52277-7_38

This license applies to the adapted motion data. Other website code and assets
retain their existing licenses.
