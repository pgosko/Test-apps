  /* worker/engine/palette.js — k-means palette extraction in OKLab + palette label maps. (fragment: concatenated inside function ENGINE(){…} by build.mjs) */
  /* --- k-means palette in OKLab --- */
  function kmeans(k,blur){
    return cached('km'+k+'_'+blur,()=>{
      const [A,B,C]=labB(blur),n=img.w*img.h,ns=Math.min(n,40000),step=n/ns;
      let seed=1234567;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const X=new Float32Array(ns*3);
      for(let s=0;s<ns;s++){const i=Math.min(n-1,(s*step+rnd()*step)|0);X[3*s]=A[i];X[3*s+1]=B[i];X[3*s+2]=C[i];}
      const cent=new Float32Array(k*3),d2=new Float32Array(ns).fill(1e9);
      let f=(rnd()*ns)|0;cent[0]=X[3*f];cent[1]=X[3*f+1];cent[2]=X[3*f+2];
      for(let c=1;c<=k;c++){
        const cx=cent[3*(c-1)],cy=cent[3*(c-1)+1],cz=cent[3*(c-1)+2];let sum=0;
        for(let s=0;s<ns;s++){const dx=X[3*s]-cx,dy=X[3*s+1]-cy,dz=X[3*s+2]-cz,d=dx*dx+dy*dy+dz*dz;if(d<d2[s])d2[s]=d;sum+=d2[s];}
        if(c===k)break;
        let r=rnd()*sum,pick=ns-1;for(let s=0;s<ns;s++){r-=d2[s];if(r<=0){pick=s;break;}}
        cent[3*c]=X[3*pick];cent[3*c+1]=X[3*pick+1];cent[3*c+2]=X[3*pick+2];
      }
      const asg=new Uint8Array(ns).fill(255),dist=new Float32Array(ns);
      for(let it=0;it<40;it++){
        let changed=0;const sums=new Float64Array(k*3),cnt=new Float64Array(k);
        for(let s=0;s<ns;s++){
          let best=0,bd=1e9;const x=X[3*s],y=X[3*s+1],z=X[3*s+2];
          for(let c=0;c<k;c++){const dx=x-cent[3*c],dy=y-cent[3*c+1],dz=z-cent[3*c+2],d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;best=c;}}
          if(asg[s]!==best){changed++;asg[s]=best;}dist[s]=bd;
          sums[3*best]+=x;sums[3*best+1]+=y;sums[3*best+2]+=z;cnt[best]++;
        }
        for(let c=0;c<k;c++){
          if(cnt[c]>0){cent[3*c]=sums[3*c]/cnt[c];cent[3*c+1]=sums[3*c+1]/cnt[c];cent[3*c+2]=sums[3*c+2]/cnt[c];}
          else{let fi=0;for(let s=1;s<ns;s++)if(dist[s]>dist[fi])fi=s;dist[fi]=0;cent[3*c]=X[3*fi];cent[3*c+1]=X[3*fi+1];cent[3*c+2]=X[3*fi+2];changed++;}
        }
        if(changed<ns*0.0005)break;
      }
      const order=[...Array(k).keys()].sort((a,b)=>cent[3*a]-cent[3*b]),rank=new Uint8Array(k);order.forEach((c,i)=>rank[c]=i);
      const sc=new Float32Array(k*3);order.forEach((c,i)=>{sc[3*i]=cent[3*c];sc[3*i+1]=cent[3*c+1];sc[3*i+2]=cent[3*c+2];});
      const labels=new Uint8Array(n);
      for(let i=0;i<n;i++){
        let best=0,bd=1e9;const x=A[i],y=B[i],z=C[i];
        for(let c=0;c<k;c++){const dx=x-cent[3*c],dy=y-cent[3*c+1],dz=z-cent[3*c+2],d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;best=c;}}
        labels[i]=rank[best];
      }
      return {cent:sc,labels};
    });
  }
  function paletteLabels(p){
    return cached('pl'+p.k+'_'+p.blur+'_'+p.smooth,()=>{
      const km=kmeans(p.k,p.blur);let labels=km.labels;
      if(p.smooth>0)labels=modeFilter(labels,img.w,img.h,p.k,Math.max(1,Math.round(p.smooth*scl()*1.5)),2);
      const n=img.w*img.h,cnt=new Array(p.k).fill(0);for(let i=0;i<n;i++)cnt[labels[i]]++;
      const o=[0,0,0],cols=[];
      for(let c=0;c<p.k;c++){fromLab(km.cent[3*c],km.cent[3*c+1],km.cent[3*c+2],o);const Y=0.2126*o[0]+0.7152*o[1]+0.0722*o[2];
        cols.push({rgb:[l2s(o[0]),l2s(o[1]),l2s(o[2])],L:Lstar(Math.max(0,Y)),pct:cnt[c]/n,lab:[km.cent[3*c],km.cent[3*c+1],km.cent[3*c+2]]});}
      return {labels,cols};
    });
  }
