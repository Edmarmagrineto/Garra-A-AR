import * as THREE from 'three';
export const D2R=Math.PI/180;
export const RANGE={g:[-90,90],o:[5,110],c:[-140,0],r:[0,100]};
export const STROKE=40; // mm de curso do embolo

const T=5;
const area=p=>{const sh=a=>{let s=0;for(let i=0;i<a.length;i++){const q=a[(i+1)%a.length];s+=a[i][0]*q[1]-q[0]*a[i][1]}return Math.abs(s/2)};
  let A=sh(p.outline);p.holes.forEach(h=>A-=h.r?Math.PI*h.r*h.r:sh(h.poly));return A};

export function createArm(P,G){
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
  const MAT={mdf:mat(0xd9c39a),mdf2:mat(0xc9a877),dark:mat(0x8a6a45),syr:mat(0x6aa8e8,{transparent:true,opacity:.55,roughness:.2}),pis:mat(0xdddddd,{roughness:.5}),steel:mat(0x4a4f55,{roughness:.4,metalness:.6}),tube:mat(0xbfe3ff,{transparent:true,opacity:.7,roughness:.2})};
  const root=new THREE.Group(),mm=new THREE.Group();mm.scale.setScalar(0.001);root.add(mm);
  const groups={giro:[],ombro:[],cot:[],garra:[],painel:[],base:[]};
  const woods=[];
  const tag=(o,n)=>o.traverse(m=>{if(m.isMesh){groups[n].push(m);if(m.userData.wood)woods.push(m)}});
  const build=(id,tf,mt,z0)=>{const p=P[id];const V=a=>new THREE.Vector2(...tf(a));const s=new THREE.Shape(p.outline.map(V));
    p.holes.forEach(h=>{const pa=new THREE.Path();if(h.r){const c=tf([h.x,h.y]);pa.absarc(c[0],c[1],h.r,0,Math.PI*2,true)}else pa.setFromPoints(h.poly.map(V));s.holes.push(pa)});
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false,curveSegments:12}),mt.clone());
    m.material.transparent=true;m.userData.wood=true;m.castShadow=m.receiveShadow=true;m.position.z=z0;return m};
  const bbox=id=>{let a=[1e9,1e9],b=[-1e9,-1e9];P[id].outline.forEach(q=>{a=[Math.min(a[0],q[0]),Math.min(a[1],q[1])];b=[Math.max(b[0],q[0]),Math.max(b[1],q[1])]});return{a,b}};
  const link=(id,mt,z0)=>{const p=P[id],cs=p.holes.filter(h=>h.r),horiz=p.w>p.h;cs.sort((u,v)=>horiz?u.x-v.x:u.y-v.y);
    const A=cs[0],B=cs[cs.length-1],ang=Math.atan2(B.y-A.y,B.x-A.x),c=Math.cos(-ang),s=Math.sin(-ang);
    return{mesh:build(id,q=>{const x=q[0]-A.x,y=q[1]-A.y;return[c*x-s*y,s*x+c*y]},mt,z0),len:Math.hypot(B.x-A.x,B.y-A.y)}};
  const upright=(id,mt,z0)=>{const b=bbox(id),cx=(b.a[0]+b.b[0])/2;return build(id,q=>[q[0]-cx,q[1]-b.a[1]],mt,z0)};
  const cyl=(r,l,mt,axis)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,20),mt);m.castShadow=true;if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m};
  const pin=g=>{const m=cyl(1.5,40,MAT.steel,'z');g.add(m);tag(m,'base');groups.base.pop()};

  // base
  const base=new THREE.Group();mm.add(base);
  {const b=bbox(3),cx=(b.a[0]+b.b[0])/2,cy=(b.a[1]+b.b[1])/2;const m=build(3,q=>[q[0]-cx,q[1]-cy],MAT.mdf2,0);m.rotation.x=-Math.PI/2;m.rotation.z=Math.PI/2;m.position.y=T;base.add(m);tag(m,'base')}
  const wall=(id,x)=>{const m=upright(id,MAT.mdf,0);m.rotation.y=Math.PI/2;m.position.set(x,T,0);base.add(m);tag(m,'painel')};
  wall(0,-88);wall(22,92);
  // master syringes
  const h22=P[22].holes.filter(h=>h.r).sort((a,b)=>a.x-b.x),b22=bbox(22),c22=(b22.a[0]+b22.b[0])/2;
  const BX=92+T+30;const pist=[];
  h22.forEach(h=>{const z=-(h.x-c22),y=T+(h.y-b22.a[1]);
    const bar=cyl(8,70,MAT.syr,'x');bar.position.set(BX,y,z);base.add(bar);tag(bar,'painel');
    const rod=cyl(2.5,60,MAT.pis,'x');base.add(rod);const hd=cyl(6,6,MAT.pis);hd.rotation.set(0,0,0);rod.add(hd);hd.position.y=-30;tag(rod,'painel');
    pist.push({rod,y,z,end:new THREE.Vector3(BX+35,y,z)})});
  // turntable, tower
  const px=-45;
  const disc=cyl(22,T,MAT.dark);disc.position.set(px,T+T/2+T,0);base.add(disc);tag(disc,'giro');
  { // plataforma giratoria (peca 28) sobre o disco
    const b=bbox(28),cx=(b.a[0]+b.b[0])/2,cy=(b.a[1]+b.b[1])/2;const pg=new THREE.Group();pg.position.set(px,3*T,0);pg.rotation.y=Math.PI/2;base.add(pg);
    const m=build(28,q=>[q[0]-cx,q[1]-cy],MAT.mdf2,0);m.rotation.x=-Math.PI/2;pg.add(m);tag(m,'giro')}
  const yaw=new THREE.Group();yaw.position.set(px,4*T,0);base.add(yaw);
  const tower=upright(6,MAT.mdf,-T/2);yaw.add(tower);tag(tower,'giro');
  const tb=bbox(6),towerH=tb.b[1]-tb.a[1];
  const shoulder=new THREE.Group();shoulder.position.set(0,towerH-12,0);yaw.add(shoulder);pin(shoulder);
  const b1=link(8,MAT.mdf,T/2+1),b2=link(9,MAT.mdf,-T/2-1-T);shoulder.add(b1.mesh,b2.mesh);tag(b1.mesh,'ombro');tag(b2.mesh,'ombro');const Lb=b1.len;
  const elbow=new THREE.Group();elbow.position.set(Lb,0,0);shoulder.add(elbow);pin(elbow);
  const f1=link(10,MAT.mdf2,T/2+1+T+1),f2=link(21,MAT.mdf2,-T/2-1-T-1-T);elbow.add(f1.mesh,f2.mesh);tag(f1.mesh,'cot');tag(f2.mesh,'cot');const Lf=f1.len;
  const wrist=new THREE.Group();wrist.position.set(Lf,0,0);elbow.add(wrist);pin(wrist);
  let clawLen=0,ga=null,gb=null,gnodes=[],gMass=0;
  if(G){ // Garra A real (CAD) montada no punho
    const gs=G.scene;const mount=new THREE.Group(),inner=new THREE.Group();wrist.add(mount);mount.add(inner);inner.scale.setScalar(1000);inner.add(gs);
    const poses=G.poses,b0=poses.find(p=>p.name.startsWith('NB_base')),fg=poses.find(p=>p.name==='A_dedo_1');
    const s2=Math.sign(fg.closed[2]-b0.closed[2])||1,s1=-s2;
    mount.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(0,0,s2,0, 0,1,0,0, s1,0,0,0, 0,0,0,1));
    const box=new THREE.Box3().setFromObject(gs);
    const zb=s2>0?box.min.z:box.max.z,zf=s2>0?box.max.z:box.min.z;clawLen=Math.abs(zf-zb)*1000;
    inner.position.set(-(box.min.x+box.max.x)/2*1000,-(box.min.y+box.max.y)/2*1000,-zb*1000);
    gs.children.slice().forEach(n=>{const po=poses.find(p=>p.name===n.name);if(!po)return;
      if(/espacador|parafuso/.test(n.name))po.angle=0;
      n.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.userData.wood=true;o.castShadow=true;
        const p=o.geometry.attributes.position,ix=o.geometry.index;let v=0;for(let i=0;i<ix.count;i+=3){const a=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,ix.getX(i+k)));v+=a[0].dot(a[1].clone().cross(a[2]))/6}gMass+=Math.abs(v)*1e6*0.7}});
      gnodes.push({n,po})});
    tag(gs,'garra');
  }else{
    const finger=(id,z0)=>{const p=P[id],cs=p.holes.filter(h=>h.r),A=cs[0],B=cs[1],ang=Math.atan2(B.y-A.y,B.x-A.x),c=Math.cos(-ang),s=Math.sin(-ang);
      const tf=q=>{const x=q[0]-A.x,y=q[1]-A.y;return[c*x-s*y,s*x+c*y]};p.outline.forEach(q=>clawLen=Math.max(clawLen,tf(q)[0]));return build(id,tf,MAT.dark,z0)};
    ga=new THREE.Group();gb=new THREE.Group();wrist.add(ga,gb);ga.add(finger(14,0));gb.add(finger(15,-T));tag(ga,'garra');tag(gb,'garra');
  }
  // slave syringes
  const slave=(parent,pos,axis)=>{const g=new THREE.Group();g.position.set(...pos);parent.add(g);
    const inner=new THREE.Group();g.add(inner);if(axis==='x')inner.rotation.z=Math.PI/2;if(axis==='z')inner.rotation.x=Math.PI/2;
    const bar=cyl(6,40,MAT.syr);inner.add(bar);const rod=cyl(2,30,MAT.pis);inner.add(rod);const port=new THREE.Object3D();port.position.set(0,-22,0);inner.add(port);
    return{g,inner,rod,port,bar}};
  const S=[slave(base,[px+34,T+9,30],'z'),slave(yaw,[12,38,12],'y'),slave(shoulder,[Lb*.4,16,19],'x'),slave(elbow,[Lf*.45,16,19],'x')];
  S.forEach((s,i)=>{tag(s.bar,['giro','ombro','cot','garra'][i]);tag(s.rod,['giro','ombro','cot','garra'][i])});
  // tubes
  const tubes=[];for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.BufferGeometry(),MAT.tube);mm.add(t);tubes.push(t)}
  // test piece
  const piece=new THREE.Mesh(new THREE.CylinderGeometry(20,20,12,40),mat(0x7d8793,{metalness:.7,roughness:.35}));piece.castShadow=true;mm.add(piece);

  const J={g:0,o:60,c:-70,r:40};
  const norm=j=>[(j.g-RANGE.g[0])/180,(j.o-RANGE.o[0])/105,(-j.c)/140,j.r/100];
  const V3=new THREE.Vector3();
  function setPose(j){Object.assign(J,j);
    yaw.rotation.y=-J.g*D2R;shoulder.rotation.z=J.o*D2R;elbow.rotation.z=J.c*D2R;
    if(ga){const op=J.r/100*28*D2R;ga.rotation.z=op;gb.rotation.z=-op}
    const sg=J.r/100;gnodes.forEach(({n,po})=>{for(let k=0;k<3;k++)n.position.setComponent(k,po.closed[k]+(po.open[k]-po.closed[k])*sg);n.rotation.set(0,po.angle*sg,0)});
    const n=norm(J);
    pist.forEach((p,i)=>p.rod.position.set(BX+35-n[i]*STROKE,p.y,p.z));
    S.forEach((s,i)=>s.rod.position.y=18-n[i]*STROKE*.6);
    mm.updateMatrixWorld(true);
    tubes.forEach((t,i)=>{const a=pist[i].end.clone();base.localToWorld(a);mm.worldToLocal(a);
      const b=new THREE.Vector3();s_port(S[i],b);const mid=a.clone().lerp(b,.5);mid.y+=25+i*6;mid.z+=(i-1.5)*8;
      const c=new THREE.CatmullRomCurve3([a,a.clone().add(new THREE.Vector3(18,6,0)),mid,b.clone().add(new THREE.Vector3(0,12,0)),b]);
      t.geometry.dispose();t.geometry=new THREE.TubeGeometry(c,24,1.6,6,false)});
    return n}
  function s_port(s,out){s.port.getWorldPosition(out);mm.worldToLocal(out)}
  const wp=o=>{mm.updateMatrixWorld(true);const v=new THREE.Vector3();o.getWorldPosition(v);return mm.worldToLocal(v)};
  const tipLen=clawLen*.8;const tipLocal=new THREE.Vector3(tipLen,0,0);
  const tipPos=()=>{mm.updateMatrixWorld(true);const v=tipLocal.clone();wrist.localToWorld(v);return mm.worldToLocal(v)};
  // masses (g): MDF 0.70 g/cm3, 5 mm
  const mass=id=>area(P[id])*T/1000*0.7;
  const M={boom:mass(8)+mass(9),fore:mass(10)+mass(21),claw:G?gMass:mass(14)+mass(15),tower:mass(6)+mass(28),base:mass(3),total:0};
  M.total=M.boom+M.fore+M.claw+M.tower+M.base+mass(0)+mass(22);
  return{root,mm,base,yaw,shoulder,elbow,wrist,groups,woods,pist,slave:S,tubes,piece,J,setPose,norm,tipPos,wp,Lb,Lf,px,towerH,clawLen,tipLen,shoulderY:4*T+towerH-12,M,MAT};
}
