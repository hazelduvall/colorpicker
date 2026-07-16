{ pkgs }:
pkgs.mkShell {
  packages = with pkgs; [
    awscli2
    corepack
    nodejs
  ];

  # shellHook = ''
  #   export SASS_EMBEDDED_BIN_PATH="${pkgs.dart-sass}/bin/sass";
  # '';
}
